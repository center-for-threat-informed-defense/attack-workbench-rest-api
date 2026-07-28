'use strict';

const request = require('supertest');
const { expect } = require('expect');

const config = require('../../../config/config');
const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');
const login = require('../../shared/login');
const versioningService = require('../../../services/release-tracks/versioning-service');

const staticMarkingDefinitionId = 'marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168';

function buildTechnique(name, previous) {
  const timestamp = previous
    ? new Date(new Date(previous.stix.modified).getTime() + 1000).toISOString()
    : new Date().toISOString();
  return {
    workspace: { workflow: { state: 'work-in-progress' } },
    stix: {
      id: previous?.stix.id,
      created: previous?.stix.created || timestamp,
      modified: timestamp,
      name,
      description: `${name} description`,
      spec_version: '2.1',
      type: 'attack-pattern',
      object_marking_refs: [staticMarkingDefinitionId],
      kill_chain_phases: [{ kill_chain_name: 'mitre-attack', phase_name: 'persistence' }],
      x_mitre_is_subtechnique: false,
      x_mitre_platforms: ['Windows'],
    },
  };
}

describe('Release-track release planning and commit API', function () {
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

  async function get(path, status = 200) {
    return request(app)
      .get(path)
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(status);
  }

  async function post(path, body, status = 200) {
    return request(app)
      .post(path)
      .send(body)
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(status);
  }

  async function createTrack(name, type = 'standard') {
    return (await post('/api/release-tracks/new', { name, type }, 201)).body;
  }

  it('defaults to a non-persisting summary preview with type-oriented counts', async function () {
    const track = await createTrack('Release Preview Summary');
    const preview = await get(`/api/release-tracks/${track.id}/snapshots/latest/release/preview`);

    expect(preview.body).toMatchObject({
      track_id: track.id,
      type: 'standard',
      source_snapshot_modified: track.modified,
      version: '1.0',
      releasable: true,
      before: { members_count: 0, staged_count: 0, candidates_count: 0 },
      after: { members_count: 0, staged_count: 0, candidates_count: 0 },
      changes: { promoted_count: 0 },
      conflicts: [],
    });

    const unchanged = await get(`/api/release-tracks/${track.id}/snapshots/latest`);
    expect(unchanged.body.version).toBeNull();
    expect(unchanged.body.version_history).toEqual([]);
  });

  it('renders the same plan as a workbench snapshot or STIX bundle', async function () {
    const track = await createTrack('Release Preview Formats');
    const workbench = await get(
      `/api/release-tracks/${track.id}/snapshots/latest/release/preview?format=workbench&version=2.4`,
    );
    expect(workbench.body.version).toBe('2.4');
    expect(workbench.body.version_history).toHaveLength(1);
    expect(workbench.body.version_history[0].summary).toMatchObject({
      members_count: 0,
      staged_count: 0,
      candidates_count: 0,
    });

    const bundle = await get(
      `/api/release-tracks/${track.id}/snapshots/latest/release/preview?format=bundle&version=2.4&includeToc=false`,
    );
    expect(bundle.body.type).toBe('bundle');
    expect(bundle.body.objects).toEqual([]);

    const unchanged = await get(`/api/release-tracks/${track.id}/snapshots/latest`);
    expect(unchanged.body.version).toBeNull();
  });

  it('commits the planned version', async function () {
    const track = await createTrack('Release Commit');
    const preview = await get(
      `/api/release-tracks/${track.id}/snapshots/latest/release/preview?increment=major`,
    );
    const released = await post(`/api/release-tracks/${track.id}/snapshots/latest/release`, {
      increment: 'major',
    });

    expect(released.body.version).toBe(preview.body.version);
    expect(released.body.version_history.at(-1).summary).toMatchObject(preview.body.after);
  });

  it('resolves latest when the release request is handled', async function () {
    const track = await createTrack('Release Latest Selector');
    const preview = await get(`/api/release-tracks/${track.id}/snapshots/latest/release/preview`);
    const updated = await post(`/api/release-tracks/${track.id}/meta`, {
      description: 'new latest',
    });

    const released = await post(`/api/release-tracks/${track.id}/snapshots/latest/release`, {});
    expect(released.body.modified).toBe(updated.body.modified);
    expect(released.body.modified).not.toBe(preview.body.source_snapshot_modified);
    expect(released.body.version).toBe('1.0');
  });

  it('previews and releases an explicitly selected historical snapshot', async function () {
    const track = await createTrack('Historical Release');
    await post(`/api/release-tracks/${track.id}/meta`, { description: 'new latest' });
    const preview = await get(
      `/api/release-tracks/${track.id}/snapshots/${track.modified}/release/preview?version=3.0`,
    );
    expect(preview.body.source_snapshot_modified).toBe(track.modified);
    const released = await post(
      `/api/release-tracks/${track.id}/snapshots/${track.modified}/release`,
      {
        version: '3.0',
      },
    );
    expect(released.body.modified).toBe(track.modified);
    expect(released.body.version).toBe('3.0');
  });

  it('orients virtual previews around members and quarantine', async function () {
    const track = await createTrack('Virtual Release Preview', 'virtual');
    const preview = await get(`/api/release-tracks/${track.id}/snapshots/latest/release/preview`);
    expect(preview.body.type).toBe('virtual');
    expect(preview.body.before).toEqual({ members_count: 0, quarantine_count: 0 });
    expect(preview.body.before).not.toHaveProperty('staged_count');
    expect(preview.body.before).not.toHaveProperty('candidates_count');
  });

  it('reports blocking promotion conflicts in summaries and rejects materialization', async function () {
    const revisionA = (await post('/api/techniques', buildTechnique('Release Conflict A'), 201))
      .body;
    const revisionB = (
      await post('/api/techniques', buildTechnique('Release Conflict B', revisionA), 201)
    ).body;
    const track = await createTrack('Release Conflict');
    await post(`/api/release-tracks/${track.id}/contents`, {
      x_mitre_contents: [{ obj_ref: revisionA.stix.id, obj_modified: revisionA.stix.modified }],
    });
    await post(`/api/release-tracks/${track.id}/candidates`, {
      object_refs: [{ id: revisionB.stix.id, modified: revisionB.stix.modified }],
    });
    await post(`/api/release-tracks/${track.id}/candidates/promote`, {
      object_refs: [revisionB.stix.id],
    });

    const summary = await get(`/api/release-tracks/${track.id}/snapshots/latest/release/preview`);
    expect(summary.body.releasable).toBe(false);
    expect(summary.body.conflicts).toHaveLength(1);

    await get(
      `/api/release-tracks/${track.id}/snapshots/latest/release/preview?format=workbench`,
      409,
    );
    await post(
      `/api/release-tracks/${track.id}/snapshots/latest/release`,
      {
        increment: 'minor',
      },
      409,
    );
  });

  it('rejects ambiguous and legacy release inputs', async function () {
    const track = await createTrack('Release Validation');
    expect(() =>
      versioningService.planRelease(track.id, track, [], {
        increment: 'minor',
        version: '2.0',
      }),
    ).toThrow('increment and version are mutually exclusive');

    await get(
      `/api/release-tracks/${track.id}/snapshots/latest/release/preview?increment=minor&version=2.0`,
      400,
    );
    await post(
      `/api/release-tracks/${track.id}/snapshots/latest/release`,
      {
        increment: 'minor',
        version: '2.0',
      },
      400,
    );
    await post(
      `/api/release-tracks/${track.id}/snapshots/latest/release`,
      {
        type: 'minor',
        dry_run: true,
      },
      400,
    );
  });

  it('reserves filesystemstore previews as not implemented', async function () {
    const track = await createTrack('Release FilesystemStore Preview');
    await get(
      `/api/release-tracks/${track.id}/snapshots/latest/release/preview?format=filesystemstore`,
      501,
    );
  });

  it('does not expose the removed bump endpoints', async function () {
    const track = await createTrack('Removed Bump Route');
    await get(`/api/release-tracks/${track.id}/bump/preview`, 404);
    await post(`/api/release-tracks/${track.id}/bump`, { type: 'minor' }, 404);
  });
});
