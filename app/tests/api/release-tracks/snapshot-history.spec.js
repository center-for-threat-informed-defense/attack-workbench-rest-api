const request = require('supertest');
const { expect } = require('expect');

const config = require('../../../config/config');
const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');
const login = require('../../shared/login');
const dynamicRepo = require('../../../repository/release-tracks/release-track-dynamic.repository');
const {
  ReleaseTrackContentManifestEntry,
} = require('../../../models/release-tracks/release-track-content-manifest-model');

const markingDefinitionId = 'marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168';
const objectRevisions = [];

function memberEntry(index) {
  return {
    object_ref: objectRevisions[index].id,
    object_modified: objectRevisions[index].modified,
  };
}

function stagedEntry(index, modified) {
  return {
    ...memberEntry(index),
    object_status: 'reviewed',
    object_staged_at: modified,
    object_staged_by: 'snapshot-history-test',
  };
}

function candidateEntry(index, modified) {
  return {
    ...memberEntry(index),
    object_status: 'work-in-progress',
    object_added_at: modified,
    object_added_by: 'snapshot-history-test',
  };
}

function snapshotBase(snapshot) {
  const clone = { ...snapshot };
  delete clone._id;
  delete clone.__v;
  return clone;
}

describe('GET /api/release-tracks/:id/snapshots', function () {
  let app;
  let passportCookie;
  let standardTrack;
  let virtualTrack;
  let standardTaggedModified;
  let standardLatestModified;

  before(async function () {
    await database.initializeConnection();
    await databaseConfiguration.checkSystemConfiguration();

    config.validateRequests.withAttackDataModel = true;
    config.validateRequests.withOpenApi = true;

    app = await require('../../../index').initializeApp();
    passportCookie = await login.loginAnonymous(app);

    for (let index = 0; index < 6; index++) {
      objectRevisions.push(await createTechnique(`Snapshot History Technique ${index + 1}`));
    }
    standardTrack = await createTrack('Snapshot History Standard', 'standard');
    virtualTrack = await createTrack('Snapshot History Virtual', 'virtual');

    const standardCreated = new Date(standardTrack.modified);
    standardTaggedModified = new Date(standardCreated.getTime() + 1000);
    standardLatestModified = new Date(standardCreated.getTime() + 2000);

    await dynamicRepo.saveSnapshot(standardTrack.id, {
      ...snapshotBase(standardTrack),
      modified: standardTaggedModified,
      version: '1.0',
      content_manifest_id: 'release-track-content-manifest--snapshot-history',
      bundle_id: 'bundle--snapshot-history',
      bundle_hashes: {
        manifest_id: 'release-track-content-manifest--snapshot-history',
        stix_2_0: 'a'.repeat(64),
        stix_2_1: 'b'.repeat(64),
      },
      members: [memberEntry(0), memberEntry(1)],
      staged: [stagedEntry(2, standardTaggedModified)],
      candidates: [
        candidateEntry(3, standardTaggedModified),
        candidateEntry(4, standardTaggedModified),
        candidateEntry(5, standardTaggedModified),
      ],
    });
    const manifestCommon = {
      manifest_id: 'release-track-content-manifest--snapshot-history',
      track_id: standardTrack.id,
      snapshot_modified: standardTaggedModified,
    };
    const versionedManifestEntry = (index, kind, extra = {}) => ({
      ...manifestCommon,
      revision_key: `${objectRevisions[index].id}::${new Date(
        objectRevisions[index].modified,
      ).getTime()}`,
      kind,
      object_ref: objectRevisions[index].id,
      object_modified: objectRevisions[index].modified,
      ...extra,
    });
    await ReleaseTrackContentManifestEntry.insertMany([
      versionedManifestEntry(0, 'root', { tier: 'members' }),
      versionedManifestEntry(1, 'root', { tier: 'members' }),
      versionedManifestEntry(2, 'secondary'),
      versionedManifestEntry(3, 'secondary'),
      versionedManifestEntry(4, 'relationship'),
      {
        ...manifestCommon,
        revision_key: `${markingDefinitionId}::unversioned`,
        kind: 'supporting',
        object_ref: markingDefinitionId,
      },
      versionedManifestEntry(5, 'link_target'),
    ]);
    await dynamicRepo.saveSnapshot(standardTrack.id, {
      ...snapshotBase(standardTrack),
      modified: standardLatestModified,
      version: null,
      members: [memberEntry(0)],
      staged: [stagedEntry(1, standardLatestModified), stagedEntry(2, standardLatestModified)],
      candidates: [candidateEntry(3, standardLatestModified)],
    });

    const virtualCreated = new Date(virtualTrack.modified);
    const virtualTaggedModified = new Date(virtualCreated.getTime() + 1000);
    await dynamicRepo.saveSnapshot(virtualTrack.id, {
      ...snapshotBase(virtualTrack),
      modified: virtualTaggedModified,
      version: '1.0',
      members: [memberEntry(0), memberEntry(1)],
      quarantine: [
        {
          ...memberEntry(2),
          source_track_id: standardTrack.id,
          source_track_name: standardTrack.name,
          source_snapshot_version: '1.0',
          conflict_reason: 'conflicting object revisions',
        },
      ],
    });
  });

  async function createTrack(name, type) {
    const response = await request(app)
      .post('/api/release-tracks/new')
      .send({ name, type })
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(201);
    return response.body;
  }

  async function createTechnique(name) {
    const timestamp = new Date().toISOString();
    const response = await request(app)
      .post('/api/techniques')
      .send({
        workspace: { workflow: { state: 'work-in-progress' } },
        stix: {
          type: 'attack-pattern',
          spec_version: '2.1',
          created: timestamp,
          modified: timestamp,
          name,
          description: `${name} description`,
          object_marking_refs: [markingDefinitionId],
          kill_chain_phases: [{ kill_chain_name: 'mitre-attack', phase_name: 'persistence' }],
          x_mitre_is_subtechnique: false,
          x_mitre_platforms: ['Windows'],
        },
      })
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(201);
    return {
      id: response.body.stix.id,
      modified: response.body.stix.modified,
    };
  }

  function get(path, status = 200) {
    return request(app)
      .get(path)
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(status);
  }

  it('returns every standard snapshot newest first with standard tier counts', async function () {
    const response = await get(`/api/release-tracks/${standardTrack.id}/snapshots`);

    expect(response.body.pagination).toEqual({
      total: 3,
      limit: 50,
      offset: 0,
    });
    expect(response.body.data).toHaveLength(3);
    expect(response.body.data[0]).toMatchObject({
      id: standardTrack.id,
      type: 'standard',
      modified: standardLatestModified.toISOString(),
      version: null,
      members_count: 1,
      staged_count: 2,
      candidates_count: 1,
    });
    expect(response.body.data[0]).not.toHaveProperty('quarantine_count');
    // The rolling draft inherits the track-creation manifest, which holds
    // only the publishing identity as a supporting object.
    expect(response.body.data[0]).toMatchObject({
      content_manifest_id: standardTrack.content_manifest_id,
      content_statistics: {
        primary_count: 0,
        secondary_count: 0,
        relationship_count: 0,
        supporting_count: 1,
        link_target_count: 0,
        total_count: 1,
      },
    });
    expect(response.body.data[0]).not.toHaveProperty('bundle_id');
    expect(response.body.data[1]).toMatchObject({
      modified: standardTaggedModified.toISOString(),
      version: '1.0',
      content_manifest_id: 'release-track-content-manifest--snapshot-history',
      bundle_id: 'bundle--snapshot-history',
      bundle_hashes: {
        manifest_id: 'release-track-content-manifest--snapshot-history',
        stix_2_0: 'a'.repeat(64),
        stix_2_1: 'b'.repeat(64),
      },
      members_count: 2,
      staged_count: 1,
      candidates_count: 3,
      content_statistics: {
        primary_count: 2,
        secondary_count: 2,
        relationship_count: 1,
        supporting_count: 1,
        link_target_count: 1,
        total_count: 7,
      },
    });
  });

  it('returns type-oriented counts for virtual snapshots', async function () {
    const response = await get(`/api/release-tracks/${virtualTrack.id}/snapshots?tagged=true`);

    expect(response.body.pagination.total).toBe(1);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({
      id: virtualTrack.id,
      type: 'virtual',
      version: '1.0',
      members_count: 2,
      quarantine_count: 1,
    });
    expect(response.body.data[0]).not.toHaveProperty('staged_count');
    expect(response.body.data[0]).not.toHaveProperty('candidates_count');
  });

  it('filters tagged and untagged snapshots before pagination', async function () {
    const tagged = await get(
      `/api/release-tracks/${standardTrack.id}/snapshots?tagged=true&limit=1&offset=0`,
    );
    expect(tagged.body.pagination).toEqual({
      total: 1,
      limit: 1,
      offset: 0,
    });
    expect(tagged.body.data.map((snapshot) => snapshot.version)).toEqual(['1.0']);

    const untagged = await get(
      `/api/release-tracks/${standardTrack.id}/snapshots?tagged=false&limit=1&offset=1`,
    );
    expect(untagged.body.pagination).toEqual({
      total: 2,
      limit: 1,
      offset: 1,
    });
    expect(untagged.body.data).toHaveLength(1);
    expect(untagged.body.data[0].version).toBeNull();
  });

  it('retrieves the latest snapshot from the canonical endpoint', async function () {
    const response = await get(`/api/release-tracks/${standardTrack.id}/snapshots/latest`);

    expect(response.body.modified).toBe(standardLatestModified.toISOString());
    expect(response.body.members).toHaveLength(1);
    expect(response.body.staged).toHaveLength(2);
    expect(response.body.candidates).toHaveLength(1);
  });

  it('does not allow latest-snapshot retrieval at the release-track resource path', async function () {
    await get(`/api/release-tracks/${standardTrack.id}`, 405);
  });

  it('rejects invalid filter and pagination values', async function () {
    await get(`/api/release-tracks/${standardTrack.id}/snapshots?tagged=yes`, 400);
    await get(`/api/release-tracks/${standardTrack.id}/snapshots?limit=0`, 400);
    await get(`/api/release-tracks/${standardTrack.id}/snapshots?limit=201`, 400);
    await get(`/api/release-tracks/${standardTrack.id}/snapshots?offset=-1`, 400);
  });

  it('returns 404 when the release track does not exist', async function () {
    await get(
      '/api/release-tracks/release-track--00000000-0000-4000-8000-000000000099/snapshots',
      404,
    );
  });

  after(async function () {
    await database.closeConnection();
  });
});
