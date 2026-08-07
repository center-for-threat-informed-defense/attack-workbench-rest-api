'use strict';

const { isDeepStrictEqual } = require('node:util');
const { v4: uuidv4 } = require('uuid');
const config = require('../../config/config');
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
const { buildTocObject } = require('../../lib/release-tracks/export-schemas');
const systemConfigurationService = require('../system/system-configuration-service');
const primaryRevisionService = require('./primary-revision-service');

const MANIFEST_SCHEMA_VERSION = 2;
const RESOLVER_VERSION = 'closed-member-graph-v3';
const SOURCE_BUNDLE_RESOLVER_VERSION = 'source-bundle-pointer-v2';
const TIERS = ['members', 'staged', 'candidates', 'quarantine'];
const STATISTIC_FIELDS_BY_KIND = {
  root: 'primary_count',
  secondary: 'secondary_count',
  relationship: 'relationship_count',
  supporting: 'supporting_count',
  link_target: 'link_target_count',
};
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

async function getFirstCollectionCreated(trackId, fallback) {
  const firstCollection = await ReleaseTrackGraphManifestEntry.findOne({
    track_id: trackId,
    kind: 'collection',
  })
    .sort({ 'frozen_stix.created': 1, _id: 1 })
    .select('frozen_stix.created')
    .lean()
    .exec();
  return firstCollection?.frozen_stix?.created || fallback;
}

function collectionIdForTrack(trackId) {
  return `x-mitre-collection--${trackId.split('--')[1]}`;
}

async function organizationIdentityRef() {
  const organizationIdentity = await systemConfigurationService.retrieveOrganizationIdentity();
  return organizationIdentity.stix.id;
}

async function upsertCollectionEntry(snapshot, entries, manifest) {
  const graph = await replayEntries(entries, manifest, {});
  const created = await getFirstCollectionCreated(manifest.track_id, manifest.created_at);
  const createdByRef = await organizationIdentityRef();
  const collectionId = collectionIdForTrack(manifest.track_id);
  const collectionObject = buildTocObject(
    snapshot,
    graph.documents.map((document) => document.stix),
    {
      stixVersion: '2.1',
      attackSpecVersion: config.app.attackSpecVersion,
      collectionId,
      createdByRef,
      created,
      modified: manifest.created_at,
    },
  );
  const entry = {
    manifest_id: manifest.manifest_id,
    track_id: manifest.track_id,
    snapshot_modified: snapshot.modified,
    revision_key: `${collectionObject.id}::collection`,
    kind: 'collection',
    object_ref: collectionObject.id,
    frozen_stix: collectionObject,
  };
  const storedEntry = await ReleaseTrackGraphManifestEntry.findOneAndUpdate(
    { manifest_id: manifest.manifest_id, kind: 'collection' },
    { $set: entry },
    { new: true, upsert: true, runValidators: true, lean: true },
  ).exec();
  const existingIndex = entries.findIndex((candidate) => candidate.kind === 'collection');
  if (existingIndex === -1) entries.push(storedEntry);
  else entries[existingIndex] = storedEntry;
  return storedEntry;
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

async function resolveBoundedGraph(hydratedRoots, allowedDomains, missing) {
  const rootObjectRefs = new Set(hydratedRoots.entries.map((entry) => entry.object_ref));
  let frontierObjectRefs = new Set(rootObjectRefs);

  while (true) {
    const relationships = await relationshipsRepository.retrieveLatestTouchingObjectRefs(
      [...frontierObjectRefs],
      { includeRevoked: false, includeDeprecated: false },
    );
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

    // One batched exact-revision hydration per STIX type replaces the
    // resolver's historical one-query-per-secondary behavior.
    const hydratedEndpoints = await primaryRevisionService.hydrateEntries(
      pinnedRelationships.flatMap(({ source, target }) => [source, target]),
    );
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
      prefetchedDocuments: hydratedEndpoints.documents,
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

    const resolvedObjectRefs = new Set(resolvedGraph.documents.map((document) => document.stix.id));
    const expanded = [...resolvedObjectRefs].some(
      (objectRef) => !frontierObjectRefs.has(objectRef),
    );
    if (!expanded) {
      return { graphResolver, resolvedGraph };
    }
    frontierObjectRefs = new Set([...frontierObjectRefs, ...resolvedObjectRefs]);
  }
}

function endpointIsSelected(endpoint, membersByObjectRef) {
  const member = endpoint && membersByObjectRef.get(endpoint.object_ref);
  return (
    member &&
    revisionKey(member.object_ref, member.object_modified) ===
      revisionKey(endpoint.object_ref, endpoint.object_modified)
  );
}

function exactMemberMap(entries) {
  const membersByObjectRef = new Map();
  for (const entry of entries) {
    const existing = membersByObjectRef.get(entry.object_ref);
    if (
      existing &&
      revisionKey(existing.object_ref, existing.object_modified) !==
        revisionKey(entry.object_ref, entry.object_modified)
    ) {
      throw new ReleaseContentIntegrityError(
        [
          {
            object_ref: entry.object_ref,
            object_modified: new Date(entry.object_modified).toISOString(),
            dependency: 'unique_member_revision',
          },
        ],
        { details: 'A deterministic snapshot cannot select two revisions of one STIX object.' },
      );
    }
    membersByObjectRef.set(entry.object_ref, entry);
  }
  return membersByObjectRef;
}

async function loadPredecessorRelationshipCandidates(
  snapshot,
  predecessorManifestId,
  membersByObjectRef,
) {
  if (!predecessorManifestId) return [];

  const predecessorManifest = await ReleaseTrackGraphManifest.findOne({
    manifest_id: predecessorManifestId,
    track_id: snapshot.id,
    snapshot_modified: { $lt: snapshot.modified },
    state: { $in: ['pending', 'active'] },
  })
    .lean()
    .exec();
  if (!predecessorManifest) {
    throw new ReleaseContentIntegrityError(
      [{ manifest_id: predecessorManifestId, dependency: 'predecessor_graph_manifest' }],
      { details: 'The preceding tagged snapshot references a missing graph manifest.' },
    );
  }

  const entries = await ReleaseTrackGraphManifestEntry.find({
    manifest_id: predecessorManifestId,
    kind: 'relationship',
  })
    .lean()
    .exec();
  const selectedEntries = entries.filter(
    (entry) =>
      endpointIsSelected(entry.source, membersByObjectRef) &&
      endpointIsSelected(entry.target, membersByObjectRef),
  );
  if (selectedEntries.length === 0) return [];

  const hydrated = await primaryRevisionService.assertStoredEntries(selectedEntries);
  const documentsByRevision = new Map(
    hydrated.documents.map((document) => [
      revisionKey(document.stix.id, document.stix.modified),
      document,
    ]),
  );
  const candidates = [];
  for (const entry of selectedEntries) {
    const relationship = documentsByRevision.get(entry.revision_key);
    if (
      relationship?.stix.type !== 'relationship' ||
      relationship.stix.source_ref !== entry.source.object_ref ||
      relationship.stix.target_ref !== entry.target.object_ref
    ) {
      throw new ReleaseContentIntegrityError(
        [{ object_ref: entry.object_ref, dependency: 'predecessor_relationship_pointer' }],
        { details: 'A predecessor graph relationship no longer matches its stored endpoints.' },
      );
    }
    candidates.push({ relationship, source: entry.source, target: entry.target });
  }
  return candidates;
}

async function resolveClosedMemberRelationships(snapshot, hydratedRoots, predecessorManifestId) {
  const membersByObjectRef = exactMemberMap(hydratedRoots.entries);
  const storedRelationships = await relationshipsRepository.retrieveRevisionsTouchingExactEndpoints(
    hydratedRoots.entries,
  );
  const candidatesByRevision = new Map();

  for (const relationship of storedRelationships) {
    const source = endpointFor(relationship, 'source');
    const target = endpointFor(relationship, 'target');
    if (
      !endpointIsSelected(source, membersByObjectRef) ||
      !endpointIsSelected(target, membersByObjectRef)
    ) {
      continue;
    }
    candidatesByRevision.set(revisionKey(relationship.stix.id, relationship.stix.modified), {
      relationship,
      source,
      target,
    });
  }

  const predecessorCandidates = await loadPredecessorRelationshipCandidates(
    snapshot,
    predecessorManifestId,
    membersByObjectRef,
  );
  for (const candidate of predecessorCandidates) {
    const key = revisionKey(candidate.relationship.stix.id, candidate.relationship.stix.modified);
    if (!candidatesByRevision.has(key)) candidatesByRevision.set(key, candidate);
  }

  const candidatesByRelationship = new Map();
  for (const candidate of candidatesByRevision.values()) {
    const entries = candidatesByRelationship.get(candidate.relationship.stix.id) || [];
    entries.push(candidate);
    candidatesByRelationship.set(candidate.relationship.stix.id, entries);
  }

  const selected = [];
  for (const [relationshipId, candidates] of candidatesByRelationship) {
    const endpointPairs = new Set(
      candidates.map(
        ({ source, target }) =>
          `${revisionKey(source.object_ref, source.object_modified)}->${revisionKey(
            target.object_ref,
            target.object_modified,
          )}`,
      ),
    );
    if (endpointPairs.size > 1) {
      throw new ReleaseContentIntegrityError(
        [{ object_ref: relationshipId, dependency: 'relationship_lineage_endpoints' }],
        {
          details:
            'One relationship lineage resolves to multiple endpoint pairs in the same member graph.',
        },
      );
    }

    candidates.sort(
      (left, right) =>
        new Date(right.relationship.stix.modified).getTime() -
        new Date(left.relationship.stix.modified).getTime(),
    );
    const newest = candidates[0];
    if (
      bundleRelationships.relationshipIsActive(newest.relationship) &&
      !bundleRelationships.isDeprecatedPattern(newest.relationship.stix)
    ) {
      selected.push(newest);
    }
  }
  return selected;
}

async function buildClosedMemberManifestEntries(snapshot, options) {
  const rootRequests = (snapshot.members || []).map((entry) => ({ ...entry, tier: 'members' }));
  const hydratedRoots = await primaryRevisionService.assertStoredEntries(rootRequests);
  exactMemberMap(hydratedRoots.entries);

  const selectedRelationships = await resolveClosedMemberRelationships(
    snapshot,
    hydratedRoots,
    options.predecessorManifestId,
  );
  const relationshipDocuments = selectedRelationships.map((candidate) => candidate.relationship);
  const graphResolver = new BundleGraphResolver({
    attackObjectsRepository,
    detectionStrategiesRepository,
    repositoryMap: primaryRevisionService.getRepositoryMap(),
    policy: {
      isDeprecatedPattern: bundleRelationships.isDeprecatedPattern,
      relationshipIsActive: bundleRelationships.relationshipIsActive,
      secondaryObjectIsValid: () => false,
    },
    options: {
      inferDomains: false,
      includeRevoked: true,
      includeDeprecated: true,
      includeMissingAttackId: true,
    },
    relationships: relationshipDocuments,
    prefetchedDocuments: hydratedRoots.documents,
  });
  const supportingDocuments = await graphResolver.loadSupportingDocuments([
    ...hydratedRoots.documents.map((document) => document.stix),
    ...relationshipDocuments.map((document) => document.stix),
  ]);

  const selectedObjectRefs = new Set(hydratedRoots.entries.map((entry) => entry.object_ref));
  const rootMetadata = new Map(
    hydratedRoots.entries.map((entry) => [
      revisionKey(entry.object_ref, entry.object_modified),
      entry,
    ]),
  );
  const supportingByObjectRef = new Map();
  for (const document of supportingDocuments) {
    if (!selectedObjectRefs.has(document.stix.id)) {
      supportingByObjectRef.set(document.stix.id, document);
    }
  }

  const selectedByAttackId = new Map();
  for (const document of hydratedRoots.documents) {
    const attackId = linkById.getAttackId(document.stix);
    if (attackId) selectedByAttackId.set(attackId, document);
  }
  const linkTargets = new Map();
  for (const document of [...hydratedRoots.documents, ...relationshipDocuments]) {
    for (const attackId of linkById.extractLinkByIds(document.stix)) {
      if (selectedByAttackId.has(attackId) || linkTargets.has(attackId)) continue;
      const target = await linkById.getAttackObjectFromDatabase(attackId);
      if (target) linkTargets.set(attackId, target);
    }
  }

  const entries = hydratedRoots.documents.map((document) => {
    const key = revisionKey(document.stix.id, document.stix.modified);
    const root = rootMetadata.get(key);
    return {
      revision_key: key,
      kind: 'root',
      tier: 'members',
      object_status: root?.object_status,
      object_ref: document.stix.id,
      object_modified: document.stix.modified,
    };
  });
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
    });
  }
  for (const document of supportingByObjectRef.values()) {
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

async function buildManifestEntries(snapshot, options = {}) {
  if (options.memberOnly) {
    return buildClosedMemberManifestEntries(snapshot, options);
  }

  const allowedDomains = virtualSnapshotDomains(snapshot);
  const rootRequests = [];
  const rootTiers = TIERS;
  for (const tier of rootTiers) {
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

  const missing = [];
  const { graphResolver, resolvedGraph } = await resolveBoundedGraph(
    hydratedRoots,
    allowedDomains,
    missing,
  );
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
      // Live previews reuse the legacy replay selector, which carries the
      // request-local relationship payload without persisting it. Persisted
      // schema-v2 member manifests deliberately omit this field.
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
  const schemaVersion = options.schemaVersion ?? MANIFEST_SCHEMA_VERSION;
  const memberOnly = schemaVersion >= MANIFEST_SCHEMA_VERSION;
  const resolverVersion = memberOnly ? RESOLVER_VERSION : 'bounded-attack-graph-v1';
  const entries = await buildManifestEntries(snapshot, {
    memberOnly,
    predecessorManifestId: options.predecessorManifestId,
  });
  const common = {
    manifest_id: manifestId,
    track_id: snapshot.id,
    snapshot_modified: snapshot.modified,
  };

  const manifest = {
    ...common,
    state: 'pending',
    schema_version: schemaVersion,
    resolver_version: resolverVersion,
    baseline_reconstruction: options.baselineReconstruction === true,
    created_at: new Date(),
  };
  await ReleaseTrackGraphManifest.create(manifest);
  try {
    if (entries.length > 0) {
      await ReleaseTrackGraphManifestEntry.insertMany(
        entries.map((entry) => ({ ...common, ...entry })),
      );
    }
    // The pending manifest now protects every inserted pointer from deletion.
    // Rehydrate once inside that protection window so a revision deleted
    // during graph discovery cannot leave an attachable dangling manifest.
    await upsertCollectionEntry(snapshot, entries, manifest);
  } catch (err) {
    await discard(manifestId);
    throw err;
  }
  return manifestId;
}

function sourcePlanIntegrityError(details, references = []) {
  return new ReleaseContentIntegrityError(references, { details });
}

async function buildSourceManifestEntries(snapshot, plan) {
  const seenObjectRefs = new Set();
  const planned = [];

  for (const input of plan.entries) {
    if (seenObjectRefs.has(input.object_ref)) {
      throw sourcePlanIntegrityError(
        `Source bundle contains more than one revision for '${input.object_ref}'.`,
        [{ object_ref: input.object_ref, dependency: 'unique_source_revision' }],
      );
    }
    seenObjectRefs.add(input.object_ref);

    const isVersioned = input.object_modified != null;
    if (isVersioned && input.frozen_stix) {
      throw sourcePlanIntegrityError(
        'Versioned source-bundle entries must be exact database pointers, not frozen payloads.',
        [{ object_ref: input.object_ref, dependency: 'pointer_only_manifest' }],
      );
    }
    if (!isVersioned) {
      if (
        input.kind !== 'supporting' ||
        input.frozen_stix?.type !== 'marking-definition' ||
        input.frozen_stix?.id !== input.object_ref ||
        input.frozen_stix?.modified != null
      ) {
        throw sourcePlanIntegrityError(
          'Only unversioned marking definitions may be frozen in a schema-v2 manifest.',
          [{ object_ref: input.object_ref, dependency: 'unversioned_supporting_object' }],
        );
      }
    }
    if (input.kind === 'relationship') {
      if (!input.source || !input.target || !isVersioned) {
        throw sourcePlanIntegrityError(
          'Relationship entries require an exact relationship pointer and exact endpoint pins.',
          [{ object_ref: input.object_ref, dependency: 'relationship_endpoints' }],
        );
      }
    } else if (input.source || input.target) {
      throw sourcePlanIntegrityError(
        'Only relationship entries may declare source and target endpoint pins.',
        [{ object_ref: input.object_ref, dependency: 'relationship_endpoints' }],
      );
    }

    planned.push({
      ...input,
      object_modified: isVersioned ? new Date(input.object_modified) : undefined,
      source: input.source
        ? { ...input.source, object_modified: new Date(input.source.object_modified) }
        : undefined,
      target: input.target
        ? { ...input.target, object_modified: new Date(input.target.object_modified) }
        : undefined,
      revision_key: isVersioned
        ? revisionKey(input.object_ref, input.object_modified)
        : `${input.object_ref}::unversioned`,
    });
  }

  const expectedRoots = new Map(
    (snapshot.members || []).map((entry) => [
      revisionKey(entry.object_ref, entry.object_modified),
      entry,
    ]),
  );
  const suppliedRoots = planned.filter((entry) => entry.kind === 'root');
  const suppliedRootKeys = new Set(suppliedRoots.map((entry) => entry.revision_key));
  if (
    suppliedRoots.length !== expectedRoots.size ||
    [...expectedRoots.keys()].some((key) => !suppliedRootKeys.has(key))
  ) {
    throw sourcePlanIntegrityError(
      'Source bundle root pointers must exactly equal the tagged snapshot members.',
      [{ track_id: snapshot.id, dependency: 'snapshot_members' }],
    );
  }

  const versioned = planned.filter((entry) => entry.object_modified);
  const hydrated = await primaryRevisionService.assertStoredEntries(versioned);
  const documentsByRevision = new Map(
    hydrated.documents.map((document) => [
      revisionKey(document.stix.id, document.stix.modified),
      document,
    ]),
  );
  const selectableKeys = new Set(
    planned
      .filter((entry) => ['root', 'secondary'].includes(entry.kind))
      .map((entry) => entry.revision_key),
  );

  for (const entry of planned) {
    if (!entry.object_modified) continue;
    const document = documentsByRevision.get(entry.revision_key);
    if (entry.kind === 'relationship') {
      if (document.stix.type !== 'relationship') {
        throw sourcePlanIntegrityError(`'${entry.object_ref}' is not a relationship revision.`, [
          { object_ref: entry.object_ref, dependency: 'relationship_type' },
        ]);
      }
      for (const side of ['source', 'target']) {
        const endpoint = entry[side];
        if (document.stix[`${side}_ref`] !== endpoint.object_ref) {
          throw sourcePlanIntegrityError(
            `Relationship '${entry.object_ref}' has a mismatched ${side} pointer.`,
            [{ object_ref: entry.object_ref, dependency: `${side}_ref` }],
          );
        }
        if (!selectableKeys.has(revisionKey(endpoint.object_ref, endpoint.object_modified))) {
          throw sourcePlanIntegrityError(
            `Relationship '${entry.object_ref}' references an endpoint revision absent from the source graph.`,
            [{ ...endpoint, dependency: `${side}_revision` }],
          );
        }
      }
    } else if (document.stix.type === 'relationship') {
      throw sourcePlanIntegrityError(
        `Relationship revision '${entry.object_ref}' must use kind 'relationship'.`,
        [{ object_ref: entry.object_ref, dependency: 'entry_kind' }],
      );
    }
  }

  const includedObjectRefs = new Set(planned.map((entry) => entry.object_ref));
  for (const document of hydrated.documents) {
    const supportingRefs = [
      document.stix.created_by_ref,
      ...(document.stix.object_marking_refs || []),
    ].filter(Boolean);
    const missingRef = supportingRefs.find((objectRef) => !includedObjectRefs.has(objectRef));
    if (missingRef) {
      throw sourcePlanIntegrityError(`Source graph omits supporting object '${missingRef}'.`, [
        { object_ref: missingRef, dependency: 'supporting_object' },
      ]);
    }
  }

  return planned.map((entry) => {
    if (entry.kind !== 'root') return entry;
    const root = expectedRoots.get(entry.revision_key);
    return { ...entry, tier: 'members', object_status: root.object_status };
  });
}

async function prepareSourceReconstruction(snapshot, plan) {
  const manifestId = `release-track-graph-manifest--${uuidv4()}`;
  const entries = await buildSourceManifestEntries(snapshot, plan);
  const common = {
    manifest_id: manifestId,
    track_id: snapshot.id,
    snapshot_modified: snapshot.modified,
  };
  const manifest = {
    ...common,
    state: 'pending',
    schema_version: MANIFEST_SCHEMA_VERSION,
    resolver_version: SOURCE_BUNDLE_RESOLVER_VERSION,
    baseline_reconstruction: true,
    source_attestation: plan.source_attestation,
    created_at: new Date(),
  };

  await ReleaseTrackGraphManifest.create(manifest);
  try {
    await ReleaseTrackGraphManifestEntry.insertMany(
      entries.map((entry) => ({ ...common, ...entry })),
    );
    await upsertCollectionEntry(snapshot, entries, manifest);
  } catch (err) {
    await discard(manifestId);
    throw err;
  }
  return manifestId;
}

async function assertSourceReconstruction(snapshot, sourceAttestation) {
  const manifest = await ReleaseTrackGraphManifest.findOne({
    manifest_id: snapshot.graph_manifest_id,
    track_id: snapshot.id,
    snapshot_modified: snapshot.modified,
    state: { $in: ['pending', 'active'] },
  })
    .lean()
    .exec();
  if (
    !manifest ||
    manifest.resolver_version !== SOURCE_BUNDLE_RESOLVER_VERSION ||
    !isDeepStrictEqual(manifest.source_attestation, sourceAttestation)
  ) {
    throw sourcePlanIntegrityError(
      'Snapshot already has a graph that was not reconstructed from the same source bundle.',
      [{ manifest_id: snapshot.graph_manifest_id, dependency: 'source_attestation' }],
    );
  }
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

function emptyStatistics() {
  return {
    primary_count: 0,
    secondary_count: 0,
    relationship_count: 0,
    supporting_count: 0,
    link_target_count: 0,
    total_count: 0,
  };
}

/**
 * Count manifest entries by semantic role for a page of snapshot summaries.
 * One aggregate covers every requested manifest to avoid a per-snapshot query.
 *
 * @param {string[]} manifestIds
 * @returns {Promise<Map<string, Object>>}
 */
async function getStatisticsByManifestIds(manifestIds) {
  const uniqueManifestIds = [...new Set(manifestIds.filter(Boolean))];
  const statisticsByManifestId = new Map(
    uniqueManifestIds.map((manifestId) => [manifestId, emptyStatistics()]),
  );
  if (uniqueManifestIds.length === 0) return statisticsByManifestId;

  const counts = await ReleaseTrackGraphManifestEntry.aggregate([
    { $match: { manifest_id: { $in: uniqueManifestIds } } },
    {
      $group: {
        _id: { manifest_id: '$manifest_id', kind: '$kind' },
        count: { $sum: 1 },
      },
    },
  ]).exec();

  for (const result of counts) {
    const statistics = statisticsByManifestId.get(result._id.manifest_id);
    const field = STATISTIC_FIELDS_BY_KIND[result._id.kind];
    if (!statistics || !field) continue;
    statistics[field] = result.count;
    statistics.total_count += result.count;
  }
  return statisticsByManifestId;
}

function rootIsSelected(entry, options) {
  if (entry.tier === 'members') return true;
  if (!['staged', 'candidates'].includes(entry.tier)) return false;
  if (!(options.include || []).includes(entry.tier)) return false;
  if (!options.state) return true;
  return entry.object_status === 'reviewed' || options.state.includes(entry.object_status);
}

async function replayEntries(entries, manifest, options) {
  const pointerOnlyMemberGraph = manifest.schema_version >= MANIFEST_SCHEMA_VERSION;
  const versionedEntries = entries.filter(
    (entry) =>
      entry.object_modified &&
      (entry.kind !== 'relationship' || (pointerOnlyMemberGraph && !entry.frozen_stix)),
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
      .filter((entry) =>
        pointerOnlyMemberGraph
          ? ['root', 'secondary'].includes(entry.kind)
          : entry.kind === 'root' && rootIsSelected(entry, options),
      )
      .map((entry) => entry.revision_key),
  );

  // Special embedded-reference dependencies can be chained (for example, a
  // detection strategy discovered through an analytic that was itself a
  // relationship secondary). Replay only follows edges frozen in the
  // manifest; it never asks the live database to expand the graph.
  if (!pointerOnlyMemberGraph) {
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
  }

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
  const sourceOmittedDefaults = new Map(
    entries
      .filter((entry) => entry.omitted_optional_defaults?.length)
      .map((entry) => [entry.object_ref, entry.omitted_optional_defaults]),
  );
  const collectionObject = entries.find((entry) => entry.kind === 'collection')?.frozen_stix;

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
    sourceOmittedDefaults,
    collectionObject,
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
    .sort({ _id: 1 })
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
      schema_version: 1,
      resolver_version: RESOLVER_VERSION,
    },
    options,
  );
}

async function refreshCollectionEntry(snapshot, manifest) {
  const entries = await ReleaseTrackGraphManifestEntry.find({
    manifest_id: manifest.manifest_id,
  })
    .sort({ _id: 1 })
    .lean()
    .exec();
  return upsertCollectionEntry(snapshot, entries, manifest);
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
  prepareSourceReconstruction,
  assertSourceReconstruction,
  activate,
  discard,
  discardSnapshot,
  discardTrack,
  replay,
  replayPlannedSnapshot,
  refreshCollectionEntry,
  collectionIdForTrack,
  getStatisticsByManifestIds,
  findPinsForRevision,
  findPinsForObject,
  buildManifestEntries,
  MANIFEST_SCHEMA_VERSION,
  RESOLVER_VERSION,
  SOURCE_BUNDLE_RESOLVER_VERSION,
};
