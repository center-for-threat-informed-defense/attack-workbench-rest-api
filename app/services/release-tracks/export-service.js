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
const {
  bundleTransformSchema,
  workbenchTransformSchema,
  filesystemStoreTransformSchema,
} = require('../../lib/release-tracks/export-schemas');

// ---------------------------------------------------------------------------
// Repository map — lazy-loaded to avoid circular dependency issues at startup.
//
// Maps STIX type prefixes to their corresponding repositories so we can
// batch-query each repository's `findManyByIdAndModified` in parallel.
// ---------------------------------------------------------------------------

let _repoMap = null;

function getRepositoryMap() {
  if (_repoMap) return _repoMap;

  _repoMap = {
    [types.Technique]: require('../../repository/techniques-repository'),
    [types.Tactic]: require('../../repository/tactics-repository'),
    [types.Group]: require('../../repository/groups-repository'),
    [types.Campaign]: require('../../repository/campaigns-repository'),
    [types.Mitigation]: require('../../repository/mitigations-repository'),
    [types.Matrix]: require('../../repository/matrix-repository'),
    [types.Relationship]: require('../../repository/relationships-repository'),
    [types.MarkingDefinition]: require('../../repository/marking-definitions-repository'),
    [types.Identity]: require('../../repository/identities-repository'),
    [types.Note]: require('../../repository/notes-repository'),
    [types.DataSource]: require('../../repository/data-sources-repository'),
    [types.DataComponent]: require('../../repository/data-components-repository'),
    [types.Asset]: require('../../repository/assets-repository'),
    [types.Analytic]: require('../../repository/analytics-repository'),
    [types.DetectionStrategy]: require('../../repository/detection-strategies-repository'),
  };

  // Software types share a single repository
  const softwareRepo = require('../../repository/software-repository');
  _repoMap[types.Malware] = softwareRepo;
  _repoMap[types.Tool] = softwareRepo;

  return _repoMap;
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
  if (!entries || entries.length === 0) return [];

  // Group entries by STIX type prefix
  const byType = {};
  for (const entry of entries) {
    const type = entry.object_ref.split('--')[0];
    if (!byType[type]) byType[type] = [];
    byType[type].push(entry);
  }

  const repoMap = getRepositoryMap();
  const hydrated = [];

  await Promise.all(
    Object.entries(byType).map(async ([type, refs]) => {
      const repo = repoMap[type];
      if (!repo) {
        logger.warn(
          `ExportService: No repository for type "${type}", skipping ${refs.length} object(s)`,
        );
        return;
      }
      try {
        const docs = await repo.findManyByIdAndModified(refs);
        hydrated.push(...docs);
      } catch (err) {
        logger.error(`ExportService: Failed to hydrate ${refs.length} "${type}" object(s):`, err);
      }
    }),
  );

  return hydrated;
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
    const key = `${entry.object_ref}::${new Date(entry.object_modified).getTime()}`;
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
 *   3. Append referenced identities and marking definitions
 *   4. Convert LinkById tags to markdown citations
 *   5. Assemble the bundle (STIX version conformance + optional TOC) via the
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
    const supportingObjects = await fetchSupportingObjects(hydratedObjects);
    const allObjects = [...hydratedObjects, ...supportingObjects];
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
