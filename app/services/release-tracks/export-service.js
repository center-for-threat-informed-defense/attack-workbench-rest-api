'use strict';

// =============================================================================
// Export Service
//
// Hydrates STIX object refs (from snapshot members/staged/candidates tiers)
// into full STIX documents, then formats the output as one of:
//   - bundle:          Standard STIX 2.0 or 2.1 bundle
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
const logger = require('../../lib/logger');
const linkById = require('../../lib/linkById');
const primaryRevisionService = require('./primary-revision-service');
const graphManifestService = require('./graph-manifest-service');
const {
  bundleTransformSchema,
  workbenchTransformSchema,
  filesystemStoreTransformSchema,
} = require('../../lib/release-tracks/export-schemas');

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
 * Convert LinkById tags (e.g. "(LinkById: T1234)") in descriptions to
 * markdown citations using only object revisions supplied by the resolved
 * live or persisted graph.
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

function requiresLiveGraph(snapshot, options) {
  return (
    options.captureGraph ||
    snapshot.version == null ||
    !snapshot.graph_manifest_id ||
    (options.include || []).some((tier) => ['staged', 'candidates'].includes(tier))
  );
}

function normalizeSourceBundleDefaults(documents, graph) {
  if (graph.manifest?.resolver_version !== 'source-bundle-pointer-v2') return documents;

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

function bundleIdForManifest(manifest) {
  const uuid = manifest?.manifest_id?.split('--')[1];
  return uuid ? `bundle--${uuid}` : undefined;
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
 *   - The same pipeline applies to standard snapshots and materialized virtual
 *     snapshots because both persist exact member revisions.
 *   1. Select tier entries — members always; staged/candidates via
 *      options.include, narrowed by options.state
 *   2. Hydrate entries into full documents
 *   3. Resolve live relationships or replay exact persisted graph pointers
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
    // A persisted graph is an opt-in guarantee for members only. Graphless
    // snapshots and exports that add mutable draft tiers resolve the current
    // relationship frontier instead of implying determinism they do not have.
    const graph = requiresLiveGraph(snapshot, options)
      ? await graphManifestService.replayPlannedSnapshot(snapshot, options)
      : await graphManifestService.replay(snapshot, options);
    const allObjects = normalizeSourceBundleDefaults(graph.documents, graph);
    await convertLinkByIdTags(allObjects, graph.linkTargetDocuments);

    return exports.formatAsBundle(snapshot, allObjects, {
      stixVersion: options.stixVersion,
      includeToc: options.includeToc,
      attackSpecVersion: config.app.attackSpecVersion,
      collectionObject: graph.collectionObject,
      bundleId: bundleIdForManifest(graph.manifest),
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
