'use strict';

// =============================================================================
// Ephemeral Service
//
// Generates stateless, non-persisted STIX bundles for a given ATT&CK domain.
// Unlike regular release tracks (which store snapshots with object refs),
// ephemeral bundles are computed on-the-fly by querying the database for
// objects belonging to the requested domain.
//
// This service performs cross-service READS (permitted by the event-driven
// architecture — see docs/CROSS_SERVICE_READS_PATTERN.md) by querying STIX
// repositories directly. It does NOT write to any repository.
//
// The default 'bundle' format supplants the legacy GET /api/stix-bundles
// endpoint. Bundle generation delegates to stix-bundles-service.exportBundle
// so that all of its object-selection logic is preserved: secondary objects
// (groups, campaigns, detection strategies), relationship referential
// integrity, LinkById citation conversion, STIX version conformance, and
// x-mitre-collection (TOC) generation. See
// docs/developer/release-tracks/bundle-export.md for the parameter mapping.
//
// The 'workbench' format retains the simpler domain-query pipeline below,
// which returns full Workbench documents (stix + workspace).
// =============================================================================

const config = require('../../config/config');
const logger = require('../../lib/logger');

// ---------------------------------------------------------------------------
// Domain mapping
// ---------------------------------------------------------------------------

const DOMAIN_MAP = {
  enterprise: 'enterprise-attack',
  ics: 'ics-attack',
  mobile: 'mobile-attack',
};

// ---------------------------------------------------------------------------
// Repository references — lazy-loaded to avoid circular dependencies.
//
// Only repos whose models have `stix.x_mitre_domains` are queried directly.
// Relationships, identities, and marking definitions are discovered through
// references in primary objects.
// ---------------------------------------------------------------------------

let _repos = null;

function getRepositories() {
  if (_repos) return _repos;

  _repos = {
    technique: require('../../repository/techniques-repository'),
    tactic: require('../../repository/tactics-repository'),
    mitigation: require('../../repository/mitigations-repository'),
    software: require('../../repository/software-repository'),
    matrix: require('../../repository/matrix-repository'),
    analytic: require('../../repository/analytics-repository'),
    dataComponent: require('../../repository/data-components-repository'),
    dataSource: require('../../repository/data-sources-repository'),
    asset: require('../../repository/assets-repository'),
    relationship: require('../../repository/relationships-repository'),
    identity: require('../../repository/identities-repository'),
    markingDefinition: require('../../repository/marking-definitions-repository'),
  };

  return _repos;
}

// =============================================================================
// Internal helpers
// =============================================================================

/**
 * Collect unique identity and marking-definition STIX IDs referenced by a
 * set of STIX documents so we can fetch them in a single batch.
 */
function collectReferencedIds(documents) {
  const identityIds = new Set();
  const markingIds = new Set();

  for (const doc of documents) {
    const stix = doc.stix;
    if (stix.created_by_ref) identityIds.add(stix.created_by_ref);
    if (Array.isArray(stix.object_marking_refs)) {
      for (const ref of stix.object_marking_refs) markingIds.add(ref);
    }
  }

  return { identityIds, markingIds };
}

/**
 * Fetch identities and marking definitions by their STIX IDs.
 */
async function fetchSupportingObjects(identityIds, markingIds) {
  const repos = getRepositories();
  const results = [];

  // Fetch identities
  await Promise.all(
    [...identityIds].map(async (id) => {
      try {
        const doc = await repos.identity.retrieveLatestByStixId(id);
        if (doc) results.push(doc);
      } catch (err) {
        logger.warn(`EphemeralService: Could not fetch identity "${id}": ${err.message}`);
      }
    }),
  );

  // Fetch marking definitions
  await Promise.all(
    [...markingIds].map(async (id) => {
      try {
        const doc = await repos.markingDefinition.retrieveLatestByStixId(id);
        if (doc) results.push(doc);
      } catch (err) {
        logger.warn(`EphemeralService: Could not fetch marking definition "${id}": ${err.message}`);
      }
    }),
  );

  return results;
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Generate an ephemeral STIX bundle for a domain.
 *
 * For the default 'bundle' format, delegates to
 * stix-bundles-service.exportBundle with the following parameter mapping
 * (this endpoint supplants the deprecated GET /api/stix-bundles endpoint):
 *
 *   - stixVersion:                      preserved (default '2.1')
 *   - includeRevoked/includeDeprecated: preserved (default false)
 *   - includeObjectsWithMissingAttackId: renamed from includeMissingAttackId
 *   - includeToc:                       renamed from includeCollectionObject
 *                                       (default true)
 *   - collectionObjectVersion:          fixed at '0.1' — signifies that the
 *                                       TOC was generated ephemerally and is
 *                                       not connected to a release track
 *   - collectionObjectModified:         fixed at the current timestamp
 *   - collectionAttackSpecVersion:      fixed at config.app.attackSpecVersion
 *   - includeNotes:                     removed — notes are Workbench-native
 *                                       objects, not STIX objects
 *   - includeDataSources:               removed — data sources are deprecated
 *                                       or revoked as of ATT&CK v18, so their
 *                                       inclusion is governed entirely by
 *                                       includeDeprecated/includeRevoked
 *   - useLegacyMethod:                  removed
 *   - state:                            removed — workflow status is scoped
 *                                       to release tracks, and this endpoint
 *                                       is domain-scoped
 *
 * For the 'workbench' format, queries all domain-aware repositories in
 * parallel for the latest version of each object in the given domain, then
 * discovers and includes relationships that connect those objects, along
 * with referenced identities and marking definitions.
 *
 * @param {string} domain - One of: 'enterprise', 'ics', 'mobile'
 * @param {Object} [options] - Output options
 * @param {string} [options.format='bundle'] - Output format
 * @param {string} [options.stixVersion='2.1'] - STIX version ('2.0' or '2.1')
 * @param {boolean} [options.includeToc=true] - Include the x-mitre-collection TOC object
 * @param {boolean} [options.includeObjectsWithMissingAttackId=false] - Include objects without ATT&CK IDs
 * @param {boolean} [options.includeDeprecated=false] - Include deprecated objects
 * @param {boolean} [options.includeRevoked=false] - Include revoked objects
 * @returns {Promise<Object>} A STIX bundle (or formatted output)
 */
exports.getEphemeralBundle = async function getEphemeralBundle(domain, options = {}) {
  const attackDomain = DOMAIN_MAP[domain];
  if (!attackDomain) {
    const { BadRequestError } = require('../../exceptions');
    throw new BadRequestError({
      message: `Unknown domain: "${domain}"`,
      details: `Valid domains are: ${Object.keys(DOMAIN_MAP).join(', ')}`,
    });
  }

  const format = options.format || 'bundle';

  if (format === 'bundle') {
    const stixVersion = options.stixVersion || '2.1';

    // Lazy-load to avoid circular dependency issues at startup
    const stixBundlesService = require('../stix/stix-bundles-service');
    const bundle = await stixBundlesService.exportBundle({
      domain: attackDomain,
      stixVersion,
      includeRevoked: options.includeRevoked === true,
      includeDeprecated: options.includeDeprecated === true,
      includeMissingAttackId: options.includeObjectsWithMissingAttackId === true,
      // Notes are Workbench-native objects, not STIX objects
      includeNotes: false,
      // Data sources are all deprecated/revoked as of ATT&CK v18; let the
      // includeDeprecated/includeRevoked flags govern their inclusion
      includeDataSources: true,
      includeCollectionObject: options.includeToc !== false,
      collectionObjectVersion: '0.1',
      collectionObjectModified: new Date().toISOString(),
      collectionAttackSpecVersion: config.app.attackSpecVersion,
    });

    logger.verbose(`EphemeralService: Built ephemeral ${stixVersion} bundle for "${attackDomain}"`);
    return bundle;
  }

  const repos = getRepositories();
  const queryOptions = {
    includeRevoked: false,
    includeDeprecated: false,
  };

  logger.verbose(`EphemeralService: Generating ephemeral bundle for domain "${attackDomain}"`);

  // ------------------------------------------------------------------
  // Step 1: Query all domain-aware repositories in parallel
  // ------------------------------------------------------------------

  const [
    techniques,
    tactics,
    mitigations,
    software,
    matrices,
    analytics,
    dataComponents,
    dataSources,
    assets,
  ] = await Promise.all([
    repos.technique.retrieveAllByDomain(attackDomain, queryOptions),
    repos.tactic.retrieveAllByDomain(attackDomain, queryOptions),
    repos.mitigation.retrieveAllByDomain(attackDomain, queryOptions),
    repos.software.retrieveAllByDomain(attackDomain, queryOptions),
    repos.matrix.retrieveAllByDomain(attackDomain, queryOptions),
    repos.analytic.retrieveAllByDomain(attackDomain, queryOptions),
    repos.dataComponent.retrieveAllByDomain(attackDomain, queryOptions),
    repos.dataSource.retrieveAllByDomain(attackDomain, queryOptions),
    repos.asset.retrieveAllByDomain(attackDomain, queryOptions),
  ]);

  const primaryObjects = [
    ...techniques,
    ...tactics,
    ...mitigations,
    ...software,
    ...matrices,
    ...analytics,
    ...dataComponents,
    ...dataSources,
    ...assets,
  ];

  // ------------------------------------------------------------------
  // Step 2: Build a lookup of primary object IDs for relationship filtering
  // ------------------------------------------------------------------

  const primaryIdSet = new Set(primaryObjects.map((doc) => doc.stix.id));

  // ------------------------------------------------------------------
  // Step 3: Fetch relationships that connect primary objects
  // ------------------------------------------------------------------

  const allRelationships = await repos.relationship.retrieveAll({
    versions: 'latest',
    includeRevoked: false,
    includeDeprecated: false,
  });

  const relevantRelationships = (allRelationships.data || allRelationships).filter(
    (rel) => primaryIdSet.has(rel.stix.source_ref) || primaryIdSet.has(rel.stix.target_ref),
  );

  // ------------------------------------------------------------------
  // Step 4: Fetch supporting objects (identities, marking definitions)
  // ------------------------------------------------------------------

  const allDocs = [...primaryObjects, ...relevantRelationships];
  const { identityIds, markingIds } = collectReferencedIds(allDocs);
  const supportingObjects = await fetchSupportingObjects(identityIds, markingIds);

  // ------------------------------------------------------------------
  // Step 5: Format via export-service with a synthetic snapshot envelope
  // ------------------------------------------------------------------

  // Deduplicate by stix.id + stix.modified (in case of overlapping
  // supporting objects)
  const seen = new Set();
  const deduped = [];
  for (const doc of [...primaryObjects, ...relevantRelationships, ...supportingObjects]) {
    const key = `${doc.stix.id}::${doc.stix.modified}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(doc);
  }

  logger.verbose(
    `EphemeralService: Built ephemeral ${format} snapshot for "${attackDomain}" ` +
      `(${primaryObjects.length} primary, ${relevantRelationships.length} relationships, ` +
      `${supportingObjects.length} supporting → ${deduped.length} total objects)`,
  );

  const exportService = require('./export-service');
  const syntheticSnapshot = {
    id: `ephemeral-${domain}`,
    version: null,
    name: `${domain} (ephemeral)`,
    modified: new Date(),
    members: deduped.map((doc) => ({
      object_ref: doc.stix.id,
      // Marking definitions have no modified timestamp; fall back to created
      object_modified: doc.stix.modified || doc.stix.created,
    })),
  };

  if (format === 'filesystemstore') {
    return exportService.formatAsFilesystemStore(syntheticSnapshot, deduped);
  }
  return exportService.formatAsWorkbench(syntheticSnapshot, deduped);
};
