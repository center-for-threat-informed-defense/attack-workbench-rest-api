'use strict';

// =============================================================================
// Export Service
//
// Renders a snapshot as one of:
//   - bundle:          Standard STIX 2.0 or 2.1 bundle
//   - workbench:       Custom format with workflow metadata
//   - filesystemstore: Directory structure organized by STIX type
//
// Bundle export has exactly one content path: replay the snapshot's sealed
// content manifest. Two preview variants resolve the same closed-member graph
// live instead of replaying: release previews of an unsaved planned snapshot,
// and draft exports that add workflow tiers through `include`.
//
// This service performs cross-service READS (permitted by the event-driven
// architecture — see docs/CROSS_SERVICE_READS_PATTERN.md) by querying STIX
// repositories directly. It does NOT write to any external repository.
//
// DTO transformations are encapsulated in Zod transform schemas. See
// app/lib/release-tracks/export-schemas.js for schema definitions.
// =============================================================================

const { v5: uuidv5 } = require('uuid');
const logger = require('../../lib/logger');
const linkById = require('../../lib/linkById');
const revisionReference = require('../../lib/release-tracks/revision-reference');
const primaryRevisionService = require('./primary-revision-service');
const contentManifestService = require('./content-manifest-service');
const publicationService = require('./publication-service');
const { BadRequestError } = require('../../exceptions');
const {
  bundleTransformSchema,
  workbenchTransformSchema,
  filesystemStoreTransformSchema,
} = require('../../lib/release-tracks/export-schemas');

// Namespace for deterministic draft bundle identifiers.
const DRAFT_BUNDLE_NAMESPACE = 'c1d8c0a6-6a3d-4f0a-9c9b-4d9d0c8a5f21';

// =============================================================================
// Hydration
// =============================================================================

/**
 * Hydrate an array of tier entries into full STIX documents.
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
 * Convert LinkById tags (e.g. "(LinkById: T1234)") in descriptions to
 * markdown citations using only object revisions supplied by the replayed or
 * resolved graph.
 *
 * @param {Array<Object>} documents - Hydrated lean documents ({ stix, ... })
 */
async function convertLinkByIdTags(documents, linkTargetDocuments) {
  const byAttackId = new Map();
  for (const doc of [...documents, ...linkTargetDocuments]) {
    const attackId = linkById.getAttackId(doc.stix);
    if (attackId) byAttackId.set(attackId, doc);
  }

  const getAttackObject = async (attackId) => byAttackId.get(attackId);

  for (const doc of documents) {
    await linkById.convertLinkByIdTags(doc.stix, getAttackObject);
  }
}

function normalizeSourceBundleDefaults(documents, graph) {
  if (!graph.sourceOmittedDefaults?.size) return documents;

  return documents.map((document) => {
    const normalized = { ...document, stix: { ...document.stix } };
    // Apply only source-attested shape hints. Most v19.1 objects explicitly
    // emitted false and must retain it; a small minority omitted the default.
    for (const field of graph.sourceOmittedDefaults?.get(document.stix.id) || []) {
      if (normalized.stix[field] === false) delete normalized.stix[field];
    }
    return normalized;
  });
}

/**
 * Select the draft workflow-tier entries requested through `include`,
 * narrowed by `state`, and resolve dynamic selectors to exact revisions.
 */
async function includedTierEntries(snapshot, options) {
  const include = options.include || [];
  const entries = [];
  for (const tier of ['staged', 'candidates']) {
    if (!include.includes(tier)) continue;
    for (const entry of snapshot[tier] || []) {
      if (
        options.state &&
        entry.object_status !== 'reviewed' &&
        !options.state.includes(entry.object_status)
      ) {
        continue;
      }
      entries.push({ object_ref: entry.object_ref, object_modified: entry.object_modified });
    }
  }
  return revisionReference.resolveEntries(entries);
}

function bundleIdFor(snapshot) {
  if (snapshot.bundle_id) return snapshot.bundle_id;
  return `bundle--${uuidv5(
    `${snapshot.id}|${new Date(snapshot.modified).toISOString()}`,
    DRAFT_BUNDLE_NAMESPACE,
  )}`;
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
 * @param {Object} [options] - { stixVersion?, publication?, bundleId? }
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
 *   1. Replay the sealed content manifest (members, closed relationships,
 *      supporting objects, LinkById targets). A release preview or a draft
 *      export with `include` resolves the same closed graph live instead.
 *   2. Convert LinkById tags to markdown citations
 *   3. Assemble the bundle (STIX version conformance + collection object for
 *      STIX 2.1) via the Zod transform schema
 *
 * @param {Object} snapshot - The raw snapshot document from the dynamic repo
 * @param {string} format - One of: 'bundle', 'filesystemstore'
 * @param {Object} [options] - Additional options
 * @param {Array<string>} [options.include] - Draft-only extra tiers ('staged', 'candidates')
 * @param {Array<string>} [options.state] - Workflow status filter for included tiers
 * @param {string} [options.stixVersion] - '2.0' or '2.1' (default '2.1')
 * @param {boolean} [options.resolveLive] - Resolve the graph live (release previews)
 * @returns {Promise<Object>} The formatted export
 */
exports.exportSnapshot = async function exportSnapshot(snapshot, format, options = {}) {
  if (format === 'bundle') {
    const include = options.include || [];
    if (include.length > 0 && snapshot.version != null) {
      throw new BadRequestError({
        message:
          'Tagged snapshots export members only. The include parameter is a draft preview option.',
        details: { include },
      });
    }

    let graph;
    if (options.resolveLive || include.length > 0) {
      const extraEntries = include.length > 0 ? await includedTierEntries(snapshot, options) : [];
      graph = await contentManifestService.resolveLive(snapshot, extraEntries);
    } else {
      graph = await contentManifestService.replay(snapshot);
    }

    const publication = await publicationService.publicationForExport(snapshot);
    const allObjects = [
      ...normalizeSourceBundleDefaults(graph.documents, graph),
      ...(await contentManifestService.ensurePublicationSupport(graph.documents, publication)),
    ];
    await convertLinkByIdTags(allObjects, graph.linkTargetDocuments);

    return exports.formatAsBundle(snapshot, allObjects, {
      stixVersion: options.stixVersion,
      publication,
      bundleId: bundleIdFor(snapshot),
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
