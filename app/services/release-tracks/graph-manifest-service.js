'use strict';

const { v4: uuidv4 } = require('uuid');
const linkById = require('../../lib/linkById');
const bundleRelationships = require('../../lib/stix-bundle-relationships');
const attackObjectsRepository = require('../../repository/attack-objects-repository');
const relationshipsRepository = require('../../repository/relationships-repository');
const detectionStrategiesRepository = require('../../repository/detection-strategies-repository');
const BundleGraphResolver = require('../stix/bundle-graph-resolver');
const {
  ReleaseTrackGraphManifest,
  ReleaseTrackGraphManifestEntry,
} = require('../../models/release-tracks/release-track-graph-manifest-model');
const { ReleaseContentIntegrityError } = require('../../exceptions');
const primaryRevisionService = require('./primary-revision-service');

const RESOLVER_VERSION = 'bounded-attack-graph-v1';
const TIERS = ['members', 'staged', 'candidates', 'quarantine'];
const MUTATION_PROTECTED_ENTRY_FILTER = {
  $or: [
    { kind: { $ne: 'root' } },
    { kind: 'root', tier: { $in: ['members', 'quarantine'] } },
    { kind: 'root', 'discovered_from.0': { $exists: true } },
  ],
};

function normalizeDomain(domain) {
  return domain.endsWith('-attack') ? domain : `${domain}-attack`;
}

function virtualSnapshotDomains(snapshot) {
  if (snapshot.type !== 'virtual') return null;

  const domains = (snapshot.composition?.component_tracks || []).flatMap(
    (component) => component.filters?.domains || [],
  );
  if (domains.length === 0) return null;
  return new Set(domains.map(normalizeDomain));
}

function objectDomains(stixObject) {
  if (Array.isArray(stixObject.x_mitre_domains)) {
    return stixObject.x_mitre_domains;
  }
  if (stixObject.type === 'x-mitre-matrix') {
    return (stixObject.external_references || [])
      .map((reference) => reference.external_id)
      .filter((externalId) => typeof externalId === 'string' && externalId.endsWith('-attack'));
  }
  return [];
}

function secondaryObjectIsValid(document, allowedDomains) {
  if (!document) return false;
  if (!allowedDomains) return true;

  const domains = objectDomains(document.stix);
  return (
    domains.length === 0 || domains.some((domain) => allowedDomains.has(normalizeDomain(domain)))
  );
}

function revisionKey(objectRef, objectModified) {
  return `${objectRef}::${new Date(objectModified).getTime()}`;
}

function endpointFor(relationship, side) {
  const endpoint = relationship.workspace?.relationship_endpoints?.[side];
  const objectRef = relationship.stix[`${side}_ref`];
  if (!endpoint || endpoint.object_ref !== objectRef || !endpoint.object_modified) {
    return null;
  }
  return {
    object_ref: endpoint.object_ref,
    object_modified: endpoint.object_modified,
  };
}

async function buildManifestEntries(snapshot) {
  const allowedDomains = virtualSnapshotDomains(snapshot);
  const rootRequests = [];
  for (const tier of TIERS) {
    for (const entry of snapshot[tier] || []) {
      rootRequests.push({ ...entry, tier });
    }
  }

  const hydratedRoots = await primaryRevisionService.assertStoredEntries(rootRequests);
  const rootMetadata = new Map(
    hydratedRoots.entries.map((entry) => [
      revisionKey(entry.object_ref, entry.object_modified),
      entry,
    ]),
  );

  const rootObjectRefs = new Set(hydratedRoots.entries.map((entry) => entry.object_ref));

  const relationships = await relationshipsRepository.retrieveAllForBundle({
    includeRevoked: false,
    includeDeprecated: false,
  });
  const missing = [];
  const pinnedRelationships = [];
  for (const relationship of relationships) {
    const source = endpointFor(relationship, 'source');
    const target = endpointFor(relationship, 'target');
    if (!source || !target) {
      // Legacy relationships outside this snapshot's bounded graph cannot
      // affect its replay. Fail closed only when an unpinned relationship
      // touches a primary member by STIX ID.
      if (
        rootObjectRefs.has(relationship.stix.source_ref) ||
        rootObjectRefs.has(relationship.stix.target_ref)
      ) {
        missing.push({
          object_ref: relationship.stix.id,
          object_modified: new Date(relationship.stix.modified).toISOString(),
          dependency: 'relationship_endpoints',
        });
      }
      continue;
    }
    pinnedRelationships.push({ relationship, source, target });
  }
  if (missing.length > 0) {
    throw new ReleaseContentIntegrityError(missing, {
      details: 'Snapshot graph capture found relationships without exact endpoint pins.',
    });
  }

  const graphResolver = new BundleGraphResolver({
    attackObjectsRepository,
    detectionStrategiesRepository,
    repositoryMap: primaryRevisionService.getRepositoryMap(),
    policy: {
      isDeprecatedPattern: bundleRelationships.isDeprecatedPattern,
      relationshipIsActive: bundleRelationships.relationshipIsActive,
      secondaryObjectIsValid: (document) => secondaryObjectIsValid(document, allowedDomains),
    },
    options: {
      inferDomains: false,
      includeRevoked: true,
      includeDeprecated: true,
      includeMissingAttackId: true,
    },
    relationships: pinnedRelationships.map((candidate) => candidate.relationship),
    onMissingDependency(reference) {
      missing.push({
        ...reference,
        object_modified: new Date(reference.object_modified).toISOString(),
      });
    },
  });
  const resolvedGraph = await graphResolver.resolve(hydratedRoots.documents);
  if (missing.length > 0) {
    const uniqueMissing = [
      ...new Map(
        missing.map((reference) => [
          `${reference.object_ref}::${reference.object_modified}`,
          reference,
        ]),
      ).values(),
    ];
    throw new ReleaseContentIntegrityError(uniqueMissing, {
      details: 'Snapshot graph capture could not hydrate every exact dependency.',
    });
  }
  const selectedDocuments = new Map(
    resolvedGraph.documents.map((document) => [
      revisionKey(document.stix.id, document.stix.modified),
      document,
    ]),
  );
  const selectedRelationships = resolvedGraph.relationships.map((relationship) => ({
    relationship,
    source: endpointFor(relationship, 'source'),
    target: endpointFor(relationship, 'target'),
  }));
  const relationshipDocuments = selectedRelationships.map((candidate) => candidate.relationship);
  const discoverySources = resolvedGraph.dependencies;
  const supportingDocuments = await graphResolver.loadSupportingDocuments(resolvedGraph.objects);

  const linkTargets = new Map();
  for (const document of [...selectedDocuments.values(), ...relationshipDocuments]) {
    for (const attackId of linkById.extractLinkByIds(document.stix)) {
      if (!linkTargets.has(attackId)) {
        const target = await linkById.getAttackObjectFromDatabase(attackId);
        if (target) {
          linkTargets.set(attackId, target);
        }
      }
    }
  }

  const entries = [];
  for (const [key, document] of selectedDocuments) {
    const root = rootMetadata.get(key);
    entries.push({
      revision_key: key,
      kind: root ? 'root' : 'secondary',
      tier: root?.tier,
      object_status: root?.object_status,
      object_ref: document.stix.id,
      object_modified: document.stix.modified,
      discovered_from: discoverySources.get(key) || [],
    });
  }
  for (const candidate of selectedRelationships) {
    entries.push({
      revision_key: revisionKey(
        candidate.relationship.stix.id,
        candidate.relationship.stix.modified,
      ),
      kind: 'relationship',
      object_ref: candidate.relationship.stix.id,
      object_modified: candidate.relationship.stix.modified,
      source: candidate.source,
      target: candidate.target,
      frozen_stix: candidate.relationship.stix,
    });
  }
  for (const document of supportingDocuments) {
    const isVersioned = Boolean(document.stix.modified);
    entries.push({
      revision_key: isVersioned
        ? revisionKey(document.stix.id, document.stix.modified)
        : `${document.stix.id}::unversioned`,
      kind: 'supporting',
      object_ref: document.stix.id,
      object_modified: document.stix.modified,
      frozen_stix: isVersioned ? undefined : document.stix,
    });
  }
  for (const document of linkTargets.values()) {
    entries.push({
      revision_key: revisionKey(document.stix.id, document.stix.modified),
      kind: 'link_target',
      object_ref: document.stix.id,
      object_modified: document.stix.modified,
    });
  }

  return entries;
}

async function prepare(snapshot, options = {}) {
  const manifestId = `release-track-graph-manifest--${uuidv4()}`;
  const entries = await buildManifestEntries(snapshot);
  const common = {
    manifest_id: manifestId,
    track_id: snapshot.id,
    snapshot_modified: snapshot.modified,
  };

  await ReleaseTrackGraphManifest.create({
    ...common,
    state: 'pending',
    resolver_version: RESOLVER_VERSION,
    baseline_reconstruction: options.baselineReconstruction === true,
  });
  try {
    if (entries.length > 0) {
      await ReleaseTrackGraphManifestEntry.insertMany(
        entries.map((entry) => ({ ...common, ...entry })),
      );
    }
  } catch (err) {
    await discard(manifestId);
    throw err;
  }
  return manifestId;
}

async function activate(manifestId) {
  await ReleaseTrackGraphManifest.updateOne(
    { manifest_id: manifestId, state: 'pending' },
    { $set: { state: 'active' } },
  ).exec();
}

async function discard(manifestId) {
  await Promise.all([
    ReleaseTrackGraphManifestEntry.deleteMany({ manifest_id: manifestId }).exec(),
    ReleaseTrackGraphManifest.deleteOne({ manifest_id: manifestId }).exec(),
  ]);
}

async function discardSnapshot(trackId, snapshotModified) {
  const manifests = await ReleaseTrackGraphManifest.find({
    track_id: trackId,
    snapshot_modified: snapshotModified,
  })
    .select({ manifest_id: 1, _id: 0 })
    .lean()
    .exec();
  const manifestIds = manifests.map((manifest) => manifest.manifest_id);
  if (manifestIds.length === 0) return;

  await Promise.all([
    ReleaseTrackGraphManifestEntry.deleteMany({
      manifest_id: { $in: manifestIds },
    }).exec(),
    ReleaseTrackGraphManifest.deleteMany({
      manifest_id: { $in: manifestIds },
    }).exec(),
  ]);
}

async function discardTrack(trackId) {
  const manifests = await ReleaseTrackGraphManifest.find({ track_id: trackId })
    .select({ manifest_id: 1, _id: 0 })
    .lean()
    .exec();
  const manifestIds = manifests.map((manifest) => manifest.manifest_id);

  await Promise.all([
    manifestIds.length > 0
      ? ReleaseTrackGraphManifestEntry.deleteMany({
          manifest_id: { $in: manifestIds },
        }).exec()
      : Promise.resolve(),
    ReleaseTrackGraphManifest.deleteMany({ track_id: trackId }).exec(),
  ]);
}

function rootIsSelected(entry, options) {
  if (entry.tier === 'members') return true;
  if (!['staged', 'candidates'].includes(entry.tier)) return false;
  if (!(options.include || []).includes(entry.tier)) return false;
  if (!options.state) return true;
  return entry.object_status === 'reviewed' || options.state.includes(entry.object_status);
}

async function replayEntries(entries, manifest, options) {
  const versionedEntries = entries.filter(
    (entry) => entry.object_modified && entry.kind !== 'relationship',
  );
  const hydrated = await primaryRevisionService.assertStoredEntries(
    versionedEntries.map((entry) => ({
      object_ref: entry.object_ref,
      object_modified: entry.object_modified,
    })),
  );
  const documentsByRevision = new Map(
    hydrated.documents.map((document) => [
      revisionKey(document.stix.id, document.stix.modified),
      document,
    ]),
  );
  for (const entry of entries) {
    if (entry.frozen_stix) {
      documentsByRevision.set(entry.revision_key, {
        stix: entry.frozen_stix,
      });
    }
  }

  const selectedRevisionKeys = new Set(
    entries
      .filter((entry) => entry.kind === 'root' && rootIsSelected(entry, options))
      .map((entry) => entry.revision_key),
  );

  // Special embedded-reference dependencies can be chained (for example, a
  // detection strategy discovered through an analytic that was itself a
  // relationship secondary). Replay only follows edges frozen in the
  // manifest; it never asks the live database to expand the graph.
  let added;
  do {
    added = false;
    for (const entry of entries) {
      if (
        !['root', 'secondary'].includes(entry.kind) ||
        selectedRevisionKeys.has(entry.revision_key)
      ) {
        continue;
      }
      if (
        (entry.discovered_from || []).some((source) =>
          selectedRevisionKeys.has(revisionKey(source.object_ref, source.object_modified)),
        )
      ) {
        selectedRevisionKeys.add(entry.revision_key);
        added = true;
      }
    }
  } while (added);

  const selectedRelationships = entries.filter(
    (entry) =>
      entry.kind === 'relationship' &&
      selectedRevisionKeys.has(
        revisionKey(entry.source.object_ref, entry.source.object_modified),
      ) &&
      selectedRevisionKeys.has(revisionKey(entry.target.object_ref, entry.target.object_modified)),
  );
  for (const entry of selectedRelationships) {
    selectedRevisionKeys.add(entry.revision_key);
  }

  const selectedDocuments = [...selectedRevisionKeys]
    .map((key) => documentsByRevision.get(key))
    .filter(Boolean);
  const supportingRefs = new Set();
  for (const document of selectedDocuments) {
    if (document.stix.created_by_ref) {
      supportingRefs.add(document.stix.created_by_ref);
    }
    for (const objectRef of document.stix.object_marking_refs || []) {
      supportingRefs.add(objectRef);
    }
  }

  const supportingDocuments = entries
    .filter((entry) => entry.kind === 'supporting' && supportingRefs.has(entry.object_ref))
    .map((entry) =>
      entry.object_modified
        ? documentsByRevision.get(entry.revision_key)
        : { stix: entry.frozen_stix },
    )
    .filter(Boolean);
  const linkTargetDocuments = entries
    .filter((entry) => entry.kind === 'link_target')
    .map((entry) => documentsByRevision.get(entry.revision_key))
    .filter(Boolean);

  const emittedByRevision = new Map();
  for (const document of [...selectedDocuments, ...supportingDocuments]) {
    const key = document.stix.modified
      ? revisionKey(document.stix.id, document.stix.modified)
      : `${document.stix.id}::unversioned`;
    emittedByRevision.set(key, document);
  }

  return {
    documents: [...emittedByRevision.values()],
    linkTargetDocuments,
    manifest,
  };
}

async function replay(snapshot, options = {}) {
  if (!snapshot.graph_manifest_id) {
    throw new ReleaseContentIntegrityError(
      [
        {
          track_id: snapshot.id,
          snapshot_modified: new Date(snapshot.modified).toISOString(),
          dependency: 'graph_manifest',
        },
      ],
      { details: 'Snapshot does not reference a deterministic graph manifest.' },
    );
  }

  const manifest = await ReleaseTrackGraphManifest.findOne({
    manifest_id: snapshot.graph_manifest_id,
    track_id: snapshot.id,
    snapshot_modified: snapshot.modified,
    state: { $in: ['pending', 'active'] },
  })
    .lean()
    .exec();
  if (!manifest) {
    throw new ReleaseContentIntegrityError(
      [{ manifest_id: snapshot.graph_manifest_id, dependency: 'graph_manifest' }],
      { details: 'Snapshot graph manifest is missing.' },
    );
  }

  // A snapshot link is the durable commit record. If the process stopped
  // after linking a complete pending manifest but before activation, replay
  // remains deterministic and repairs the visibility marker opportunistically.
  if (manifest.state === 'pending') {
    await activate(manifest.manifest_id);
    manifest.state = 'active';
  }

  const entries = await ReleaseTrackGraphManifestEntry.find({
    manifest_id: manifest.manifest_id,
  })
    .lean()
    .exec();
  return replayEntries(entries, manifest, options);
}

async function replayPlannedSnapshot(snapshot, options = {}) {
  const entries = await buildManifestEntries(snapshot);
  return replayEntries(
    entries,
    {
      manifest_id: null,
      track_id: snapshot.id,
      snapshot_modified: snapshot.modified,
      state: 'preview',
      resolver_version: RESOLVER_VERSION,
    },
    options,
  );
}

async function findPinsForRevision(objectRef, objectModified) {
  const entries = await ReleaseTrackGraphManifestEntry.find({
    object_ref: objectRef,
    object_modified: objectModified,
    ...MUTATION_PROTECTED_ENTRY_FILTER,
  })
    .select({
      manifest_id: 1,
      track_id: 1,
      snapshot_modified: 1,
      kind: 1,
      tier: 1,
      _id: 0,
    })
    .lean()
    .exec();
  if (entries.length === 0) return [];

  const protectedManifestIds = new Set(
    (
      await ReleaseTrackGraphManifest.find({
        manifest_id: { $in: entries.map((entry) => entry.manifest_id) },
        state: { $in: ['pending', 'active'] },
      })
        .select({ manifest_id: 1, _id: 0 })
        .lean()
        .exec()
    ).map((manifest) => manifest.manifest_id),
  );
  return entries.filter((entry) => protectedManifestIds.has(entry.manifest_id));
}

async function findPinsForObject(objectRef) {
  const entries = await ReleaseTrackGraphManifestEntry.find({
    object_ref: objectRef,
    object_modified: { $ne: null },
    ...MUTATION_PROTECTED_ENTRY_FILTER,
  })
    .select({
      manifest_id: 1,
      track_id: 1,
      snapshot_modified: 1,
      object_modified: 1,
      kind: 1,
      tier: 1,
      _id: 0,
    })
    .lean()
    .exec();
  if (entries.length === 0) return [];

  const protectedManifestIds = new Set(
    (
      await ReleaseTrackGraphManifest.find({
        manifest_id: { $in: entries.map((entry) => entry.manifest_id) },
        state: { $in: ['pending', 'active'] },
      })
        .select({ manifest_id: 1, _id: 0 })
        .lean()
        .exec()
    ).map((manifest) => manifest.manifest_id),
  );
  return entries.filter((entry) => protectedManifestIds.has(entry.manifest_id));
}

module.exports = {
  prepare,
  activate,
  discard,
  discardSnapshot,
  discardTrack,
  replay,
  replayPlannedSnapshot,
  findPinsForRevision,
  findPinsForObject,
  buildManifestEntries,
  RESOLVER_VERSION,
};
