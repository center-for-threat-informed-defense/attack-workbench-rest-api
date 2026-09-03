'use strict';

const crypto = require('node:crypto');
const request = require('supertest');
const { expect } = require('expect');

const config = require('../../../config/config');
const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');
const login = require('../../shared/login');
const dynamicRepo = require('../../../repository/release-tracks/release-track-dynamic.repository');
const {
  ReleaseTrackContentManifest,
  ReleaseTrackContentManifestEntry,
} = require('../../../models/release-tracks/release-track-content-manifest-model');
const AttackObject = require('../../../models/attack-object-model');
const { releaseExactMembers, stageExactMembers } = require('./release-track-test-helpers');

const markingDefinitionId = 'marking-definition--613f2e26-407d-48c7-9eca-b8e91df99dc9';

function sha256(payload) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(payload, null, 4), 'utf8')
    .digest('hex');
}

describe('Sealed release-track content manifests', function () {
  let app;
  let passportCookie;
  let organizationIdentity;

  before(async function () {
    await database.initializeConnection();
    await databaseConfiguration.checkSystemConfiguration();
    config.validateRequests.withAttackDataModel = true;
    config.validateRequests.withOpenApi = true;
    app = await require('../../../index').initializeApp();
    passportCookie = await login.loginAnonymous(app);
    organizationIdentity = (
      await authenticated(request(app).get('/api/config/organization-identity')).expect(200)
    ).body;
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

  async function get(path, status = 200) {
    return (await authenticated(request(app).get(path)).expect(status)).body;
  }

  async function createTrack(name) {
    return post('/api/release-tracks/new', { name, type: 'standard' });
  }

  async function bundle(trackId, modified, query = '') {
    return get(
      `/api/release-tracks/${trackId}/snapshots/${encodeURIComponent(modified)}?format=bundle${query}`,
    );
  }

  async function entriesFor(manifestId) {
    return ReleaseTrackContentManifestEntry.find({ manifest_id: manifestId }).lean().exec();
  }

  it('seals a manifest at creation, inherits it through workflow clones, and reseals at release', async function () {
    const primary = await post('/api/techniques', technique('Sealed Primary'));
    const secondary = await post('/api/techniques', technique('Sealed Secondary'));
    const originalRelationship = await post('/api/relationships', relationship(primary, secondary));

    const track = await createTrack('Sealed Manifest Track');
    expect(track.content_manifest_id).toMatch(/^release-track-content-manifest--/);
    const initialManifest = await ReleaseTrackContentManifest.findOne({
      manifest_id: track.content_manifest_id,
    })
      .lean()
      .exec();
    expect(initialManifest).toMatchObject({
      state: 'active',
      schema_version: 2,
      seal_reason: 'track_creation',
    });
    // An empty track still seals the publishing identity as a supporting
    // object so its collection object is self-contained.
    const initialEntries = await entriesFor(track.content_manifest_id);
    expect(initialEntries.filter((entry) => entry.kind === 'root')).toHaveLength(0);
    expect(initialEntries).toEqual([
      expect.objectContaining({ kind: 'supporting', object_ref: organizationIdentity.stix.id }),
    ]);

    const staged = await stageExactMembers(app, passportCookie, track.id, [primary, secondary]);
    expect(staged.content_manifest_id).toBe(track.content_manifest_id);

    const released = await post(
      `/api/release-tracks/${track.id}/snapshots/latest/release`,
      { version: '1.0' },
      200,
    );
    expect(released.content_manifest_id).not.toBe(track.content_manifest_id);
    expect(released.bundle_id).toMatch(/^bundle--/);
    expect(released.publication).toMatchObject({
      collection_id: `x-mitre-collection--${track.id.split('--')[1]}`,
      created: track.created,
      created_by_ref: organizationIdentity.stix.id,
      attack_spec_version: config.app.attackSpecVersion,
    });
    expect(released.bundle_hashes).toEqual({
      manifest_id: released.content_manifest_id,
      stix_2_0: expect.stringMatching(/^[a-f0-9]{64}$/),
      stix_2_1: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
    // The initial manifest is no longer referenced by any snapshot.
    expect(await ReleaseTrackContentManifest.countDocuments({ track_id: track.id })).toBe(1);

    const sealed = await ReleaseTrackContentManifest.findOne({
      manifest_id: released.content_manifest_id,
    })
      .lean()
      .exec();
    expect(sealed).toMatchObject({ state: 'active', seal_reason: 'release' });
    const entries = await entriesFor(released.content_manifest_id);
    expect(entries.filter((entry) => entry.kind === 'root')).toHaveLength(2);
    expect(entries.some((entry) => entry.kind === 'secondary')).toBe(false);
    expect(entries.some((entry) => entry.kind === 'collection')).toBe(false);
    const relationshipEntry = entries.find((entry) => entry.kind === 'relationship');
    expect(relationshipEntry).toMatchObject({
      object_ref: originalRelationship.stix.id,
      object_modified: new Date(originalRelationship.stix.modified),
      source: { object_ref: primary.stix.id, object_modified: new Date(primary.stix.modified) },
      target: {
        object_ref: secondary.stix.id,
        object_modified: new Date(secondary.stix.modified),
      },
    });
    expect(relationshipEntry).not.toHaveProperty('frozen_stix');
    expect(
      entries.find((entry) => entry.object_ref === markingDefinitionId).frozen_stix,
    ).toBeDefined();
    expect(
      entries.find((entry) => entry.object_ref === organizationIdentity.stix.id),
    ).toMatchObject({ kind: 'supporting' });

    for (const stixVersion of ['2.0', '2.1']) {
      const exported = await bundle(track.id, released.modified, `&stixVersion=${stixVersion}`);
      expect(sha256(exported)).toBe(released.bundle_hashes[`stix_2_${stixVersion.split('.')[1]}`]);
      expect(exported.id).toBe(released.bundle_id);
      if (stixVersion === '2.0') {
        expect(exported.objects.some((object) => object.type === 'x-mitre-collection')).toBe(false);
      } else {
        expect(exported.objects[0]).toMatchObject({
          type: 'x-mitre-collection',
          id: released.publication.collection_id,
          x_mitre_version: '1.0',
          created: new Date(track.created).toISOString(),
          modified: new Date(released.modified).toISOString(),
          created_by_ref: organizationIdentity.stix.id,
          // No scope configures markings in the test environment, so the
          // collection carries the markings referenced by its contents.
          object_marking_refs: [markingDefinitionId],
        });
      }
    }

    // A later relationship revision never changes the sealed release.
    const corrected = await post(
      '/api/relationships',
      relationship(primary, secondary, originalRelationship),
    );
    expect(corrected.stix.id).toBe(originalRelationship.stix.id);
    const replayed = await bundle(track.id, released.modified);
    const replayedRelationship = replayed.objects.find(
      (object) => object.id === originalRelationship.stix.id,
    );
    expect(replayedRelationship.modified).toBe(originalRelationship.stix.modified);
    expect(replayedRelationship.description).toBe('Original relationship revision');

    // The rolling draft inherits the release manifest by reference.
    const draft = await post(`/api/release-tracks/${track.id}/meta`, { name: 'Sealed Next' }, 200);
    expect(draft.content_manifest_id).toBe(released.content_manifest_id);
    expect(draft).not.toHaveProperty('bundle_id');
    expect(draft).not.toHaveProperty('publication');
    const draftBundle = await bundle(track.id, draft.modified);
    expect(draftBundle.objects[0].type).toBe('x-mitre-collection');
    expect(draftBundle.objects[0]).not.toHaveProperty('x_mitre_version');
    expect(draftBundle.objects[0].modified).toBe(new Date(draft.modified).toISOString());
    expect(
      draftBundle.objects.find((object) => object.id === originalRelationship.stix.id).modified,
    ).toBe(originalRelationship.stix.modified);
    expect(draftBundle.id).not.toBe(released.bundle_id);
    expect((await bundle(track.id, draft.modified)).id).toBe(draftBundle.id);
  });

  it('reseals at commit so relationships added between releases ship and previews report them', async function () {
    const source = await post('/api/techniques', technique('Late Relationship Source'));
    const target = await post('/api/techniques', technique('Late Relationship Target'));
    const track = await createTrack('Late Relationship Track');
    const first = await releaseExactMembers(app, passportCookie, track.id, [source, target], {
      version: '1.0',
    });
    expect(
      (await entriesFor(first.content_manifest_id)).some((e) => e.kind === 'relationship'),
    ).toBe(false);

    const late = await post('/api/relationships', relationship(source, target));
    const draft = await post(`/api/release-tracks/${track.id}/meta`, { description: 'v1.1' }, 200);
    expect(draft.content_manifest_id).toBe(first.content_manifest_id);

    const preview = await get(
      `/api/release-tracks/${track.id}/snapshots/latest/release/preview?version=1.1`,
    );
    expect(preview.relationships).toMatchObject({
      selected_count: 1,
      added_count: 1,
      removed_count: 0,
      stale_endpoints: [],
    });
    expect(preview.relationships.added[0]).toMatchObject({ object_ref: late.stix.id });

    const second = await post(
      `/api/release-tracks/${track.id}/snapshots/latest/release`,
      { version: '1.1' },
      200,
    );
    expect(second.content_manifest_id).not.toBe(first.content_manifest_id);
    const secondBundle = await bundle(track.id, second.modified);
    expect(secondBundle.objects.some((object) => object.id === late.stix.id)).toBe(true);
    const firstBundle = await bundle(track.id, first.modified);
    expect(firstBundle.objects.some((object) => object.id === late.stix.id)).toBe(false);
  });

  it('ships relationships against member revisions without cloning them when an endpoint advances', async function () {
    const source = await post('/api/techniques', technique('Advancing Source'));
    const target = await post('/api/techniques', technique('Advancing Target'));
    const edge = await post('/api/relationships', relationship(source, target));
    const track = await createTrack('Advancing Endpoint Track');
    await authenticated(
      request(app)
        .put(`/api/release-tracks/${track.id}/config`)
        .send({ promotion_conflicts: { staged_to_members: 'always_overwrite' } }),
    ).expect(200);
    const first = await releaseExactMembers(app, passportCookie, track.id, [source, target], {
      version: '1.0',
    });

    const revisedPayload = structuredClone(source);
    revisedPayload.stix.modified = new Date(
      new Date(source.stix.modified).getTime() + 1000,
    ).toISOString();
    revisedPayload.stix.description = 'A newer source revision';
    const revised = await post('/api/techniques', revisedPayload);

    const versions = await get(`/api/relationships/${edge.stix.id}?versions=all`);
    expect(versions).toHaveLength(1);
    expect(versions[0].workspace.relationship_endpoints.source.object_modified).toBe(
      source.stix.modified,
    );

    // Member sync enrolled the revision as a candidate; promote it to stage
    // the next release against the newer source revision.
    await post(
      `/api/release-tracks/${track.id}/candidates/promote`,
      { object_refs: [source.stix.id] },
      200,
    );
    const preview = await get(
      `/api/release-tracks/${track.id}/snapshots/latest/release/preview?version=1.1`,
    );
    expect(preview.relationships.stale_endpoints).toEqual([
      expect.objectContaining({
        object_ref: edge.stix.id,
        source_ref: source.stix.id,
        stale_endpoints: ['source'],
      }),
    ]);

    const second = await post(
      `/api/release-tracks/${track.id}/snapshots/latest/release`,
      { version: '1.1' },
      200,
    );
    const entry = (await entriesFor(second.content_manifest_id)).find(
      (candidate) => candidate.kind === 'relationship',
    );
    expect(entry.source.object_modified).toEqual(new Date(revised.stix.modified));
    expect(entry.object_modified).toEqual(new Date(edge.stix.modified));
    const firstEntry = (await entriesFor(first.content_manifest_id)).find(
      (candidate) => candidate.kind === 'relationship',
    );
    expect(firstEntry.source.object_modified).toEqual(new Date(source.stix.modified));
  });

  it('does not resurrect an older active relationship when the newest revision is inactive', async function () {
    const source = await post('/api/techniques', technique('Inactive Relationship Source'));
    const target = await post('/api/techniques', technique('Inactive Relationship Target'));
    const active = await post('/api/relationships', relationship(source, target));
    const inactivePayload = relationship(source, target, active);
    inactivePayload.stix.x_mitre_deprecated = true;
    const inactive = await post('/api/relationships', inactivePayload);
    const track = await createTrack('Inactive Relationship Track');
    const released = await releaseExactMembers(app, passportCookie, track.id, [source, target]);

    expect(inactive.stix.id).toBe(active.stix.id);
    const entries = await ReleaseTrackContentManifestEntry.find({
      manifest_id: released.content_manifest_id,
      object_ref: active.stix.id,
    })
      .lean()
      .exec();
    expect(entries).toHaveLength(0);
  });

  it('closes the manifest over exact members without pulling non-member endpoints', async function () {
    const member = await post('/api/techniques', technique('Closed Member'));
    const outside = await post('/api/techniques', technique('Closed Outside Object'));
    const excluded = await post('/api/relationships', relationship(member, outside));
    const track = await createTrack('Closed Member Track');
    const released = await releaseExactMembers(app, passportCookie, track.id, [member]);

    const entries = await entriesFor(released.content_manifest_id);
    expect(entries.filter((entry) => entry.kind === 'root')).toHaveLength(1);
    expect(entries.some((entry) => entry.object_ref === outside.stix.id)).toBe(false);
    expect(entries.some((entry) => entry.object_ref === excluded.stix.id)).toBe(false);
  });

  it('treats include as a draft-only preview and rejects it on released snapshots', async function () {
    const member = await post('/api/techniques', technique('Include Member'));
    const candidate = await post('/api/techniques', technique('Include Candidate'));
    const edge = await post('/api/relationships', relationship(member, candidate));
    const track = await createTrack('Include Preview Track');
    const released = await releaseExactMembers(app, passportCookie, track.id, [member]);
    await post(
      `/api/release-tracks/${track.id}/candidates`,
      { object_refs: [{ id: candidate.stix.id, modified: candidate.stix.modified }] },
      200,
    );

    await authenticated(
      request(app).get(
        `/api/release-tracks/${track.id}/snapshots/${encodeURIComponent(
          released.modified,
        )}?format=bundle&include=candidates`,
      ),
    ).expect(400);

    const withCandidates = await get(
      `/api/release-tracks/${track.id}/snapshots/latest?format=bundle&include=candidates`,
    );
    const ids = withCandidates.objects.map((object) => object.id);
    expect(ids).toContain(candidate.stix.id);
    expect(ids).toContain(edge.stix.id);
    const membersOnly = await get(`/api/release-tracks/${track.id}/snapshots/latest?format=bundle`);
    expect(membersOnly.objects.some((object) => object.id === edge.stix.id)).toBe(false);
  });

  it('replaces a release manifest with a source-attested reconstruction only when named', async function () {
    const primary = await post('/api/techniques', technique('Source Graph Primary'));
    const secondary = await post('/api/techniques', technique('Source Graph Secondary'));
    const linkTarget = await post('/api/techniques', technique('Source Graph Link Target'));
    const originalRelationship = await post('/api/relationships', relationship(primary, secondary));
    const track = await createTrack('Source Attested Track');
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

    const supporting = await AttackObject.find({
      'stix.id': { $in: [primary.stix.created_by_ref, markingDefinitionId] },
    })
      .lean()
      .exec();
    const plan = {
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
          object_ref: originalRelationship.stix.id,
          object_modified: originalRelationship.stix.modified,
          source: { object_ref: primary.stix.id, object_modified: primary.stix.modified },
          target: { object_ref: secondary.stix.id, object_modified: secondary.stix.modified },
        },
        {
          kind: 'link_target',
          object_ref: linkTarget.stix.id,
          object_modified: linkTarget.stix.modified,
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
    const path = `/api/release-tracks/${track.id}/snapshots/${encodeURIComponent(
      released.modified,
    )}/graph/reconstruct`;

    // The sealed release manifest must be named explicitly.
    await authenticated(request(app).post(path).send(plan)).expect(409);
    await authenticated(
      request(app)
        .post(path)
        .send({ ...plan, replace_manifest_id: 'release-track-content-manifest--wrong' }),
    ).expect(409);

    const reconstructed = await post(path, {
      ...plan,
      replace_manifest_id: released.content_manifest_id,
    });
    expect(reconstructed.content_manifest_id).not.toBe(released.content_manifest_id);
    expect(reconstructed.bundle_id).toBe(released.bundle_id);
    expect(reconstructed.bundle_hashes.manifest_id).toBe(reconstructed.content_manifest_id);
    expect(reconstructed.bundle_hashes.stix_2_1).not.toBe(released.bundle_hashes.stix_2_1);
    expect(await ReleaseTrackContentManifest.countDocuments({ track_id: track.id })).toBe(1);
    const manifest = await ReleaseTrackContentManifest.findOne({
      manifest_id: reconstructed.content_manifest_id,
    })
      .lean()
      .exec();
    expect(manifest).toMatchObject({
      seal_reason: 'source_reconstruction',
      source_attestation: plan.source_attestation,
    });
    expect(manifest).not.toHaveProperty('resolver_version');
    expect(manifest).not.toHaveProperty('baseline_reconstruction');

    const exported = await bundle(track.id, released.modified);
    expect(sha256(exported)).toBe(reconstructed.bundle_hashes.stix_2_1);
    expect(exported.objects.find((object) => object.id === secondary.stix.id).modified).toBe(
      secondary.stix.modified,
    );
    expect(
      exported.objects.find((object) => object.id === originalRelationship.stix.id).modified,
    ).toBe(originalRelationship.stix.modified);
    expect(
      exported.objects.some((object) => object.modified === revisedRelationship.stix.modified),
    ).toBe(false);
    expect(exported.objects.some((object) => object.id === linkTarget.stix.id)).toBe(false);
    expect(exported.objects.find((object) => object.id === primary.stix.id)).not.toHaveProperty(
      'revoked',
    );

    // Same attestation is idempotent; a different one needs a fresh name.
    const idempotent = await post(path, plan, 200);
    expect(idempotent.content_manifest_id).toBe(reconstructed.content_manifest_id);
    const conflicting = structuredClone(plan);
    conflicting.source_attestation.bundle_sha256 = '1'.repeat(64);
    await authenticated(request(app).post(path).send(conflicting)).expect(409);
  });

  it('rejects reconstruction of an untagged snapshot', async function () {
    const track = await createTrack('Draft Reconstruction Rejection');
    await authenticated(
      request(app)
        .post(
          `/api/release-tracks/${track.id}/snapshots/${encodeURIComponent(
            track.modified,
          )}/graph/reconstruct`,
        )
        .send({
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
              object_ref: 'attack-pattern--00000000-0000-4000-8000-000000000000',
              object_modified: null,
            },
          ],
        }),
    ).expect(409);
  });

  it('keeps one rolling draft per standard track and releases its inherited manifest', async function () {
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
    expect(latest.content_manifest_id).toBe(track.content_manifest_id);
    expect(await ReleaseTrackContentManifest.countDocuments({ track_id: track.id })).toBe(1);
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
