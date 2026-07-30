'use strict';

// =============================================================================
// Export Service
//
// Hydrates STIX object refs (from snapshot members/staged/candidates tiers)
// into full STIX documents, then formats the output as one of:
//   - bundle:          Standard STIX 2.1 bundle
//   - workbench:       Custom format with workflow metadata
//   - filesystemstore: Directory structure organized by STIX type
//
// This service performs cross-service READS (permitted by the event-driven
// architecture — see docs/CROSS_SERVICE_READS_PATTERN.md) by querying STIX
// repositories directly. It does NOT write to any external repository.
//
// DTO transformations are encapsulated in Zod transform schemas. See
// app/lib/release-tracks/export-schemas.js for schema definitions.
// =============================================================================

const config = require('../../config/config');
const types = require('../../lib/types');
const logger = require('../../lib/logger');
const linkById = require('../../lib/linkById');
const EventBus = require('../../lib/event-bus');
const Events = require('../../lib/event-constants');
const { selectRelationshipsForBundle } = require('../../lib/stix-bundle-relationships');
const revisionReference = require('../../lib/release-tracks/revision-reference');
const primaryRevisionService = require('./primary-revision-service');
const {
  bundleTransformSchema,
  workbenchTransformSchema,
  filesystemStoreTransformSchema,
} = require('../../lib/release-tracks/export-schemas');

function getRepositoryMap() {
  return primaryRevisionService.getRepositoryMap();
}

// =============================================================================
// Hydration
// =============================================================================

/**
 * Hydrate an array of tier entries into full STIX documents.
 *
 * Groups entries by STIX type (extracted from the `object_ref` prefix) and
 * batch-queries each repository in parallel via `findManyByIdAndModified`.
 *
 * @param {Array<{object_ref: string, object_modified: string|Date}>} entries
 * @returns {Promise<Array<Object>>} Full Mongoose lean documents ({ stix, workspace, ... })
 */
exports.hydrateMembers = async function hydrateMembers(entries) {
  return (await primaryRevisionService.assertStoredEntries(entries)).documents;
};

// =============================================================================
// Bundle assembly helpers
// =============================================================================

/**
 * Select the tier entries that belong in a bundle export.
 *
 * Members are always included. Staged and candidate entries are included only
 * when named in `include`. When `state` is provided it further narrows the
 * staged/candidate entries to those whose workflow status matches — except
 * entries marked 'reviewed', which are always included irrespective of
 * `state` (reviewed content is release-ready by definition, mirroring how all
 * members are inherently reviewed).
 *
 * @param {Object} snapshot - The raw snapshot document
 * @param {Object} options - { include?: Array<'staged'|'candidates'>, state?: Array<string> }
 * @returns {Array<{object_ref: string, object_modified: string|Date}>} Deduplicated entries
 */
function collectBundleEntries(snapshot, options) {
  const include = options.include || [];
  const state = options.state;

  const filterByState = (entries) => {
    if (!state) return entries;
    return entries.filter(
      (entry) => entry.object_status === 'reviewed' || state.includes(entry.object_status),
    );
  };

  const entries = [...(snapshot.members || [])];
  if (include.includes('staged')) {
    entries.push(...filterByState(snapshot.staged || []));
  }
  if (include.includes('candidates')) {
    entries.push(...filterByState(snapshot.candidates || []));
  }

  // Deduplicate by object_ref + object_modified
  const seen = new Set();
  const deduped = [];
  for (const entry of entries) {
    const key = `${entry.object_ref}::` + revisionReference.modifiedKey(entry.object_modified);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(entry);
  }

  return deduped;
}

/**
 * Fetch identities and marking definitions referenced by the hydrated
 * documents (via created_by_ref / object_marking_refs) that are not already
 * part of the export. Emitted bundles must be self-contained, so referenced
 * supporting objects are appended even though they are not tier entries.
 *
 * @param {Array<Object>} documents - Hydrated lean documents ({ stix, ... })
 * @returns {Promise<Array<Object>>} Supporting lean documents
 */
async function fetchSupportingObjects(documents) {
  const repoMap = getRepositoryMap();
  const existingIds = new Set(documents.map((doc) => doc.stix.id));

  const identityIds = new Set();
  const markingIds = new Set();
  for (const doc of documents) {
    if (doc.stix.created_by_ref && !existingIds.has(doc.stix.created_by_ref)) {
      identityIds.add(doc.stix.created_by_ref);
    }
    for (const ref of doc.stix.object_marking_refs || []) {
      if (!existingIds.has(ref)) markingIds.add(ref);
    }
  }

  const supportingObjects = [];
  const fetchLatest = async (repo, stixId, description) => {
    try {
      const doc = await repo.retrieveLatestByStixIdLean(stixId);
      if (doc) supportingObjects.push(doc);
      else logger.warn(`ExportService: Referenced ${description} not found: ${stixId}`);
    } catch (err) {
      logger.warn(`ExportService: Could not fetch ${description} "${stixId}": ${err.message}`);
    }
  };

  await Promise.all([
    ...[...identityIds].map((id) => fetchLatest(repoMap[types.Identity], id, 'identity')),
    ...[...markingIds].map((id) =>
      fetchLatest(repoMap[types.MarkingDefinition], id, 'marking definition'),
    ),
  ]);

  return supportingObjects;
}

/**
 * Fetch the latest publishable relationships connecting selected bundle
 * objects. Relationship revisions remain indirect export-time content rather
 * than snapshot members.
 *
 * @param {Array<Object>} documents - Hydrated selected object documents
 * @returns {Promise<Array<Object>>}
 */
async function fetchRelationships(documents) {
  const selectedIds = new Set(documents.map((document) => document.stix.id));
  if (selectedIds.size === 0) return [];

  const results = await EventBus.emit(Events.BUNDLE_RELATIONSHIPS_REQUESTED, {
    objectRefs: [...selectedIds],
  });
  const relationships = results?.[0];
  if (!relationships) {
    throw new Error('Unable to retrieve relationships for release-track bundle export');
  }

  return selectRelationshipsForBundle(relationships, selectedIds).filter(
    (relationship) => !selectedIds.has(relationship.stix.id),
  );
}

/**
 * Convert LinkById tags (e.g. "(LinkById: T1234)") in descriptions to
 * markdown citations, preferring objects already in the export before
 * falling back to a database lookup. Mirrors the legacy stix-bundles-service
 * behavior so bundles emitted from release tracks match published output.
 *
 * @param {Array<Object>} documents - Hydrated lean documents ({ stix, ... })
 */
async function convertLinkByIdTags(documents) {
  const byAttackId = new Map();
  for (const doc of documents) {
    const attackId = linkById.getAttackId(doc.stix);
    if (attackId) byAttackId.set(attackId, doc);
  }

  const getAttackObject = async (attackId) =>
    byAttackId.get(attackId) || (await linkById.getAttackObjectFromDatabase(attackId));

  for (const doc of documents) {
    await linkById.convertLinkByIdTags(doc.stix, getAttackObject);
  }
}

// =============================================================================
// Format helpers (delegating to Zod transform schemas)
// =============================================================================

/**
 * Format as a standard STIX bundle.
 *
 * Only includes `stix` properties — no workspace data or workflow metadata.
 * Transformation logic is defined in export-schemas.js.
 *
 * @param {Object} snapshot - The raw snapshot document
 * @param {Array<Object>} hydratedObjects - Hydrated lean documents
 * @param {Object} [options] - { stixVersion?, includeToc?, attackSpecVersion? }
 */
exports.formatAsBundle = function formatAsBundle(snapshot, hydratedObjects, options) {
  return bundleTransformSchema.parse({ snapshot, hydratedObjects, options });
};

/**
 * Format as a workbench-optimized response with full metadata.
 *
 * Includes `stix` + `workspace` properties and tier annotations.
 * Transformation logic is defined in export-schemas.js.
 */
exports.formatAsWorkbench = function formatAsWorkbench(snapshot, hydratedObjects) {
  return workbenchTransformSchema.parse({ snapshot, hydratedObjects });
};

/**
 * Format as a FileSystemStore-compatible directory structure.
 *
 * Objects are grouped by STIX type, each with a filename and content property.
 * Transformation logic is defined in export-schemas.js.
 * See docs/COLLECTIONS_V2/07_OUTPUT_FORMATS.md for specification.
 */
exports.formatAsFilesystemStore = function formatAsFilesystemStore(snapshot, hydratedObjects) {
  return filesystemStoreTransformSchema.parse({ snapshot, hydratedObjects });
};

// =============================================================================
// Main export entry point
// =============================================================================

/**
 * Export a snapshot in the specified STIX-oriented format.
 *
 * Workbench snapshot retrieval is handled by release-tracks-service because it
 * returns the release-track snapshot shape with UI-friendly tier entry details.
 *
 * Bundle exports (see docs/developer/release-tracks/bundle-export.md):
 *   1. Select tier entries — members always; staged/candidates via
 *      options.include, narrowed by options.state
 *   2. Hydrate entries into full documents
 *   3. Append current relationships whose endpoints are both selected
 *   4. Append referenced identities and marking definitions
 *   5. Convert LinkById tags to markdown citations
 *   6. Assemble the bundle (STIX version conformance + optional TOC) via the
 *      Zod transform schema
 *
 * @param {Object} snapshot - The raw snapshot document from the dynamic repo
 * @param {string} format - One of: 'bundle', 'filesystemstore'
 * @param {Object} [options] - Additional options
 * @param {Array<string>} [options.include] - Extra tiers to include in bundles ('staged', 'candidates')
 * @param {Array<string>} [options.state] - Workflow status filter for included staged/candidates
 * @param {string} [options.stixVersion] - '2.0' or '2.1' (default '2.1')
 * @param {boolean} [options.includeToc] - Include the x-mitre-collection TOC object (default true)
 * @returns {Promise<Object>} The formatted export
 */
exports.exportSnapshot = async function exportSnapshot(snapshot, format, options = {}) {
  if (format === 'bundle') {
    const entries = collectBundleEntries(snapshot, options);
    const hydratedObjects = await exports.hydrateMembers(entries);
    const relationships = await fetchRelationships(hydratedObjects);
    const supportingObjects = await fetchSupportingObjects([...hydratedObjects, ...relationships]);
    const allObjects = [...hydratedObjects, ...relationships, ...supportingObjects];
    await convertLinkByIdTags(allObjects);

    return exports.formatAsBundle(snapshot, allObjects, {
      stixVersion: options.stixVersion,
      includeToc: options.includeToc,
      attackSpecVersion: config.app.attackSpecVersion,
    });
  }

  if (format === 'filesystemstore') {
    const hydratedMembers = await exports.hydrateMembers(snapshot.members || []);
    return exports.formatAsFilesystemStore(snapshot, hydratedMembers);
  }

  // Unknown format -- return the snapshot unchanged.
  logger.warn(`ExportService: Unknown format "${format}", returning snapshot unchanged`);
  return snapshot;
};
