'use strict';

const request = require('supertest');
const { expect } = require('expect');

const config = require('../../../config/config');
const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');
const login = require('../../shared/login');
const dynamicRepo = require('../../../repository/release-tracks/release-track-dynamic.repository');
const {
  ReleaseTrackGraphManifest,
  ReleaseTrackGraphManifestEntry,
} = require('../../../models/release-tracks/release-track-graph-manifest-model');
const relationshipsRepository = require('../../../repository/relationships-repository');
const AttackObject = require('../../../models/attack-object-model');
const { releaseExactMembers } = require('./release-track-test-helpers');

const markingDefinitionId = 'marking-definition--613f2e26-407d-48c7-9eca-b8e91df99dc9';

describe('Opt-in deterministic release-track graphs', function () {
  let app;
  let passportCookie;

  before(async function () {
    await database.initializeConnection();
    await databaseConfiguration.checkSystemConfiguration();
    config.validateRequests.withAttackDataModel = true;
    config.validateRequests.withOpenApi = true;
    app = await require('../../../index').initializeApp();
    passportCookie = await login.loginAnonymous(app);
  });

  function authenticated(builder) {
    return builder
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`);
  }

  function technique(name) {
    const timestamp = new Date().toISOString();
    return {
      workspace: { workflow: { state: 'work-in-progress' } },
      stix: {
        created: timestamp,
        modified: timestamp,
        name,
        description: `${name} description`,
        spec_version: '2.1',
        type: 'attack-pattern',
        object_marking_refs: [markingDefinitionId],
        kill_chain_phases: [{ kill_chain_name: 'mitre-attack', phase_name: 'persistence' }],
        x_mitre_domains: ['enterprise-attack'],
        x_mitre_is_subtechnique: false,
        x_mitre_platforms: ['Windows'],
        x_mitre_version: '1.0',
      },
    };
  }

  function relationship(source, target, previous) {
    const modified = previous
      ? new Date(new Date(previous.stix.modified).getTime() + 1000).toISOString()
      : new Date().toISOString();
    return {
      workspace: { workflow: { state: 'work-in-progress' } },
      stix: {
        id: previous?.stix.id,
        created: previous?.stix.created || modified,
        modified,
        spec_version: '2.1',
        type: 'relationship',
        relationship_type: 'uses',
        source_ref: source.stix.id,
        target_ref: target.stix.id,
        description: previous ? 'New relationship revision' : 'Original relationship revision',
        object_marking_refs: [markingDefinitionId],
      },
    };
  }

  async function post(path, body, status = 201) {
    return (await authenticated(request(app).post(path).send(body)).expect(status)).body;
  }

  async function createTrack(name) {
    return post('/api/release-tracks/new', { name, type: 'standard' });
  }

  async function sourcePlan(primary, secondary, relationshipRevision) {
    const supporting = await AttackObject.find({
      'stix.id': {
        $in: [primary.stix.created_by_ref, markingDefinitionId],
      },
    })
      .lean()
      .exec();
    return {
      source_attestation: {
        kind: 'source-bundle',
        bundle_sha256: '0'.repeat(64),
        collection_id: 'x-mitre-collection--1f5f1533-f617-4ca8-9ab4-6a02367fa019',
        release: '19.1',
        domain: 'enterprise-attack',
      },
      entries: [
        {
          kind: 'root',
          object_ref: primary.stix.id,
          object_modified: primary.stix.modified,
          omitted_optional_defaults: ['revoked'],
        },
        {
          kind: 'secondary',
          object_ref: secondary.stix.id,
          object_modified: secondary.stix.modified,
        },
        {
          kind: 'relationship',
          object_ref: relationshipRevision.stix.id,
          object_modified: relationshipRevision.stix.modified,
          source: {
            object_ref: primary.stix.id,
            object_modified: primary.stix.modified,
          },
          target: {
            object_ref: secondary.stix.id,
            object_modified: secondary.stix.modified,
          },
        },
        ...supporting.map((document) => ({
          kind: 'supporting',
          object_ref: document.stix.id,
          object_modified: document.stix.modified
            ? new Date(document.stix.modified).toISOString()
            : null,
          ...(document.stix.modified ? {} : { frozen_stix: document.stix }),
        })),
      ],
    };
  }

  it('creates pointer-only member graphs only when a tagged snapshot opts in', async function () {
    const primary = await post('/api/techniques', technique('Opt-in Graph Primary'));
    const secondary = await post('/api/techniques', technique('Opt-in Graph Secondary'));
    const originalRelationship = await post('/api/relationships', relationship(primary, secondary));
    const track = await createTrack('Opt in Graph Track');
    const released = await releaseExactMembers(app, passportCookie, track.id, [primary]);

    expect(released).not.toHaveProperty('graph_manifest_id');
    expect(await ReleaseTrackGraphManifest.countDocuments({ track_id: track.id })).toBe(0);

    const globalRelationshipScan = relationshipsRepository.retrieveAllForBundle;
    relationshipsRepository.retrieveAllForBundle = async () => {
      throw new Error('graph capture must not scan every relationship');
    };
    let graphSnapshot;
    try {
      graphSnapshot = await post(
        `/api/release-tracks/${track.id}/snapshots/${encodeURIComponent(released.modified)}/graph`,
        {},
      );
    } finally {
      relationshipsRepository.retrieveAllForBundle = globalRelationshipScan;
    }
    expect(graphSnapshot.graph_manifest_id).toBeDefined();

    const manifest = await ReleaseTrackGraphManifest.findOne({
      manifest_id: graphSnapshot.graph_manifest_id,
    })
      .lean()
      .exec();
    expect(manifest.schema_version).toBe(2);

    const entries = await ReleaseTrackGraphManifestEntry.find({
      manifest_id: graphSnapshot.graph_manifest_id,
    })
      .lean()
      .exec();
    expect(entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'root',
          object_ref: primary.stix.id,
          object_modified: expect.any(Date),
        }),
        expect.objectContaining({
          kind: 'secondary',
          object_ref: secondary.stix.id,
          object_modified: expect.any(Date),
        }),
        expect.objectContaining({
          kind: 'relationship',
          object_ref: originalRelationship.stix.id,
          object_modified: expect.any(Date),
        }),
      ]),
    );
    const relationshipEntry = entries.find((entry) => entry.kind === 'relationship');
    expect(relationshipEntry).not.toHaveProperty('frozen_stix');
    for (const entry of entries.filter((item) => ['root', 'secondary'].includes(item.kind))) {
      expect(entry.discovered_from).toBeUndefined();
    }
    const markingEntry = entries.find((entry) => entry.object_ref === markingDefinitionId);
    expect(markingEntry.frozen_stix).toBeDefined();

    const correctedRelationship = await post(
      '/api/relationships',
      relationship(primary, secondary, originalRelationship),
    );
    expect(correctedRelationship.stix.id).toBe(originalRelationship.stix.id);

    const bundle = (
      await authenticated(
        request(app).get(
          `/api/release-tracks/${track.id}/snapshots/${encodeURIComponent(
            released.modified,
          )}?format=bundle`,
        ),
      ).expect(200)
    ).body;
    const exportedRelationship = bundle.objects.find(
      (object) => object.id === originalRelationship.stix.id,
    );
    expect(exportedRelationship.modified).toBe(originalRelationship.stix.modified);
    expect(exportedRelationship.description).toBe('Original relationship revision');

    const idempotent = await post(
      `/api/release-tracks/${track.id}/snapshots/${encodeURIComponent(released.modified)}/graph`,
      {},
      200,
    );
    expect(idempotent.graph_manifest_id).toBe(graphSnapshot.graph_manifest_id);

    await authenticated(
      request(app).delete(
        `/api/release-tracks/${track.id}/snapshots/${encodeURIComponent(released.modified)}/graph`,
      ),
    ).expect(204);
    await authenticated(
      request(app).delete(
        `/api/release-tracks/${track.id}/snapshots/${encodeURIComponent(released.modified)}/graph`,
      ),
    ).expect(204);

    const liveBundle = (
      await authenticated(
        request(app).get(
          `/api/release-tracks/${track.id}/snapshots/${encodeURIComponent(
            released.modified,
          )}?format=bundle`,
        ),
      ).expect(200)
    ).body;
    const liveRelationship = liveBundle.objects.find(
      (object) => object.id === originalRelationship.stix.id,
    );
    expect(liveRelationship.modified).toBe(correctedRelationship.stix.modified);
    expect(liveRelationship.description).toBe('New relationship revision');
  });

  it('rejects graph creation for an untagged snapshot', async function () {
    const track = await createTrack('Draft Graph Rejection');
    await authenticated(
      request(app)
        .post(
          `/api/release-tracks/${track.id}/snapshots/${encodeURIComponent(track.modified)}/graph`,
        )
        .send({}),
    ).expect(409);
  });

  it('reconstructs a historical graph from exact source-bundle pointers', async function () {
    const primary = await post('/api/techniques', technique('Source Graph Primary'));
    const secondary = await post('/api/techniques', technique('Source Graph Secondary'));
    const linkTarget = await post('/api/techniques', technique('Source Graph Link Target'));
    const originalRelationship = await post('/api/relationships', relationship(primary, secondary));
    const track = await createTrack('Source Attested Graph Track');
    const released = await releaseExactMembers(app, passportCookie, track.id, [primary]);

    const revisedSecondaryPayload = structuredClone(secondary);
    revisedSecondaryPayload.stix.modified = new Date(
      new Date(secondary.stix.modified).getTime() + 1000,
    ).toISOString();
    revisedSecondaryPayload.stix.description = 'Post-release secondary revision';
    const revisedSecondary = await post('/api/techniques', revisedSecondaryPayload);
    const revisedRelationship = await post(
      '/api/relationships',
      relationship(primary, revisedSecondary, originalRelationship),
    );

    const plan = await sourcePlan(primary, secondary, originalRelationship);
    plan.entries.push({
      kind: 'link_target',
      object_ref: linkTarget.stix.id,
      object_modified: linkTarget.stix.modified,
    });
    const invalidPlan = structuredClone(plan);
    invalidPlan.entries.find((entry) => entry.kind === 'relationship').target.object_modified =
      revisedSecondary.stix.modified;
    await authenticated(
      request(app)
        .post(
          `/api/release-tracks/${track.id}/snapshots/${encodeURIComponent(
            released.modified,
          )}/graph/reconstruct`,
        )
        .send(invalidPlan),
    ).expect(409);

    const reconstructed = await post(
      `/api/release-tracks/${track.id}/snapshots/${encodeURIComponent(
        released.modified,
      )}/graph/reconstruct`,
      plan,
    );
    const manifest = await ReleaseTrackGraphManifest.findOne({
      manifest_id: reconstructed.graph_manifest_id,
    })
      .lean()
      .exec();
    expect(manifest).toMatchObject({
      schema_version: 2,
      resolver_version: 'source-bundle-pointer-v2',
      baseline_reconstruction: true,
      source_attestation: plan.source_attestation,
    });

    const entries = await ReleaseTrackGraphManifestEntry.find({
      manifest_id: reconstructed.graph_manifest_id,
    })
      .lean()
      .exec();
    expect(
      entries.find((entry) => entry.object_ref === originalRelationship.stix.id),
    ).not.toHaveProperty('frozen_stix');
    expect(entries.find((entry) => entry.object_ref === linkTarget.stix.id)).toMatchObject({
      kind: 'link_target',
    });

    const bundle = (
      await authenticated(
        request(app).get(
          `/api/release-tracks/${track.id}/snapshots/${encodeURIComponent(
            released.modified,
          )}?format=bundle`,
        ),
      ).expect(200)
    ).body;
    expect(bundle.objects.find((object) => object.id === secondary.stix.id).modified).toBe(
      secondary.stix.modified,
    );
    expect(
      bundle.objects.find((object) => object.id === originalRelationship.stix.id).modified,
    ).toBe(originalRelationship.stix.modified);
    expect(
      bundle.objects.some((object) => object.modified === revisedRelationship.stix.modified),
    ).toBe(false);
    expect(bundle.objects.some((object) => object.id === linkTarget.stix.id)).toBe(false);
    expect(bundle.objects.find((object) => object.id === primary.stix.id)).not.toHaveProperty(
      'revoked',
    );

    await post(
      `/api/release-tracks/${track.id}/snapshots/${encodeURIComponent(
        released.modified,
      )}/graph/reconstruct`,
      plan,
      200,
    );
    const conflictingAttestation = structuredClone(plan);
    conflictingAttestation.source_attestation.bundle_sha256 = '1'.repeat(64);
    await authenticated(
      request(app)
        .post(
          `/api/release-tracks/${track.id}/snapshots/${encodeURIComponent(
            released.modified,
          )}/graph/reconstruct`,
        )
        .send(conflictingAttestation),
    ).expect(409);
  });

  it('keeps one rolling draft per standard track', async function () {
    const track = await createTrack('Rolling Standard Draft');
    await post(`/api/release-tracks/${track.id}/meta`, { description: 'first replacement' }, 200);
    const latest = await post(
      `/api/release-tracks/${track.id}/meta`,
      { description: 'second replacement' },
      200,
    );

    const snapshots = await dynamicRepo.getAllSnapshots(track.id);
    expect(snapshots.data.filter((snapshot) => snapshot.version == null)).toHaveLength(1);
    expect(new Date(snapshots.data[0].modified).getTime()).toBe(
      new Date(latest.modified).getTime(),
    );
    expect(latest).not.toHaveProperty('graph_manifest_id');
  });

  it('treats versioned STIX payloads as immutable while allowing workspace-only PUTs', async function () {
    const object = await post('/api/techniques', technique('Immutable STIX Revision'));
    const changed = structuredClone(object);
    changed.stix.description = 'An illegal in-place STIX correction';

    const rejected = await authenticated(
      request(app)
        .put(`/api/techniques/${object.stix.id}/modified/${object.stix.modified}`)
        .send(changed),
    ).expect(409);
    expect(rejected.body.message).toMatch(/immutable/i);

    const workspaceOnly = structuredClone(object);
    workspaceOnly.workspace.workflow.state = 'awaiting-review';
    const accepted = await authenticated(
      request(app)
        .put(`/api/techniques/${object.stix.id}/modified/${object.stix.modified}`)
        .send(workspaceOnly),
    ).expect(200);
    expect(accepted.body.stix.description).toBe(object.stix.description);
    expect(accepted.body.workspace.workflow.state).toBe('awaiting-review');
  });

  after(async function () {
    await database.closeConnection();
  });
});
