'use strict';

const request = require('supertest');
const { expect } = require('expect');

const config = require('../../../config/config');
const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');
const login = require('../../shared/login');
const versioningService = require('../../../services/release-tracks/versioning-service');
const dynamicRepo = require('../../../repository/release-tracks/release-track-dynamic.repository');

const staticMarkingDefinitionId = 'marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168';
const virtualObjectRefs = [
  'attack-pattern--00000000-0000-4000-8000-000000000101',
  'attack-pattern--00000000-0000-4000-8000-000000000102',
  'attack-pattern--00000000-0000-4000-8000-000000000103',
  'attack-pattern--00000000-0000-4000-8000-000000000104',
];

function snapshotBase(snapshot) {
  const clone = { ...snapshot };
  delete clone._id;
  delete clone.__v;
  return clone;
}

function memberEntry(objectRef, modified) {
  return { object_ref: objectRef, object_modified: modified };
}

function quarantineEntry(objectRef, modified, sourceTrackId) {
  return {
    object_ref: objectRef,
    object_modified: modified,
    source_track_id: sourceTrackId,
    source_track_name: 'Virtual Release Source',
    source_snapshot_version: '1.0',
    conflict_reason: 'Conflicting component revisions',
  };
}

function compositionResolution(modified) {
  return {
    resolved_at: modified,
    component_snapshots: [],
    summary: { total_objects: 0, quarantined_objects: 0 },
  };
}

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

  async function put(path, body, status = 200) {
    return request(app)
      .put(path)
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
    expect(released.body.version_history.at(-1)).not.toHaveProperty('component_versions');
  });

  it('freezes a dynamic staged reference to the latest revision during release', async function () {
    const revisionA = (await post('/api/techniques', buildTechnique('Dynamic Release A'), 201))
      .body;
    const track = await createTrack('Dynamic Standard Release');
    await put(`/api/release-tracks/${track.id}/config`, {
      member_sync: { strategy: 'manual' },
    });

    const candidate = await post(`/api/release-tracks/${track.id}/candidates`, {
      object_refs: [revisionA.stix.id],
    });
    expect(candidate.body.candidates).toEqual([
      expect.objectContaining({
        object_ref: revisionA.stix.id,
        object_modified: 'latest',
      }),
    ]);

    const staged = await post(`/api/release-tracks/${track.id}/candidates/promote`, {
      object_refs: [revisionA.stix.id],
    });
    expect(staged.body.staged).toEqual([
      expect.objectContaining({
        object_ref: revisionA.stix.id,
        object_modified: 'latest',
      }),
    ]);

    const revisionB = (
      await post('/api/techniques', buildTechnique('Dynamic Release B', revisionA), 201)
    ).body;
    const draft = await get(`/api/release-tracks/${track.id}/snapshots/latest`);
    expect(draft.body.staged[0]).toMatchObject({
      object_ref: revisionB.stix.id,
      object_modified: 'latest',
      name: revisionB.stix.name,
    });

    const draftBundle = await get(
      `/api/release-tracks/${track.id}/snapshots/latest` +
        '?format=bundle&include=staged&includeToc=false',
    );
    expect(draftBundle.body.objects).toEqual([
      expect.objectContaining({
        id: revisionB.stix.id,
        modified: revisionB.stix.modified,
      }),
    ]);

    const preview = await get(
      `/api/release-tracks/${track.id}/snapshots/latest/release/preview?format=workbench`,
    );
    expect(preview.body.staged).toEqual([]);
    expect(preview.body.members).toEqual([
      expect.objectContaining({
        object_ref: revisionB.stix.id,
        object_modified: revisionB.stix.modified,
      }),
    ]);

    const unchangedDraft = await get(`/api/release-tracks/${track.id}/snapshots/latest`);
    expect(unchangedDraft.body.staged[0].object_modified).toBe('latest');

    const revisionC = (
      await post('/api/techniques', buildTechnique('Dynamic Release C', revisionB), 201)
    ).body;
    const released = await post(`/api/release-tracks/${track.id}/snapshots/latest/release`, {});
    expect(released.body.staged).toEqual([]);
    expect(released.body.members).toEqual([
      {
        object_ref: revisionC.stix.id,
        object_modified: revisionC.stix.modified,
      },
    ]);

    await post('/api/techniques', buildTechnique('Dynamic Release D', revisionC), 201);
    const immutable = await get(
      `/api/release-tracks/${track.id}/snapshots/${encodeURIComponent(released.body.modified)}`,
    );
    expect(immutable.body.members[0].object_modified).toBe(revisionC.stix.modified);
  });

  it('resolves a historical draft dynamic selector when that draft is released', async function () {
    const revisionA = (await post('/api/techniques', buildTechnique('Historical Dynamic A'), 201))
      .body;
    const track = await createTrack('Historical Dynamic Release');
    await put(`/api/release-tracks/${track.id}/config`, {
      member_sync: { strategy: 'manual' },
    });
    await post(`/api/release-tracks/${track.id}/candidates`, {
      object_refs: [{ id: revisionA.stix.id, modified: 'latest' }],
    });
    const staged = await post(`/api/release-tracks/${track.id}/candidates/promote`, {
      object_refs: [revisionA.stix.id],
    });
    await post(`/api/release-tracks/${track.id}/meta`, {
      description: 'newer unrelated draft',
    });

    const revisionB = (
      await post('/api/techniques', buildTechnique('Historical Dynamic B', revisionA), 201)
    ).body;
    const releasePath =
      `/api/release-tracks/${track.id}/snapshots/` +
      `${encodeURIComponent(staged.body.modified)}/release`;
    const released = await post(releasePath, { version: '4.0' });

    expect(released.body.members).toEqual([
      {
        object_ref: revisionB.stix.id,
        object_modified: revisionB.stix.modified,
      },
    ]);
  });

  it('preserves an explicitly pinned staged revision during release', async function () {
    const revisionA = (await post('/api/techniques', buildTechnique('Pinned Release A'), 201)).body;
    const track = await createTrack('Pinned Standard Release');
    await put(`/api/release-tracks/${track.id}/config`, {
      member_sync: { strategy: 'manual' },
    });
    await post(`/api/release-tracks/${track.id}/candidates`, {
      object_refs: [{ id: revisionA.stix.id, modified: revisionA.stix.modified }],
    });
    await post(`/api/release-tracks/${track.id}/candidates/promote`, {
      object_refs: [revisionA.stix.id],
    });

    await post('/api/techniques', buildTechnique('Pinned Release B', revisionA), 201);
    const released = await post(`/api/release-tracks/${track.id}/snapshots/latest/release`, {});

    expect(released.body.members).toEqual([
      {
        object_ref: revisionA.stix.id,
        object_modified: revisionA.stix.modified,
      },
    ]);
  });

  it('records immutable component versions when previewing and releasing a virtual draft', async function () {
    const member = (await post('/api/techniques', buildTechnique('Provenance Member'), 201)).body;
    const component = await createTrack('Provenance Component');
    await post(`/api/release-tracks/${component.id}/contents`, {
      x_mitre_contents: [{ obj_ref: member.stix.id, obj_modified: member.stix.modified }],
    });
    const firstComponentRelease = await post(
      `/api/release-tracks/${component.id}/snapshots/latest/release`,
      {},
    );
    expect(firstComponentRelease.body.version).toBe('1.0');

    const virtual = (
      await post(
        '/api/release-tracks/new',
        {
          name: 'Virtual Provenance',
          type: 'virtual',
          composition: {
            component_tracks: [
              {
                track_id: component.id,
                resolution_strategy: 'latest_tagged',
                priority: 1,
              },
            ],
          },
        },
        201,
      )
    ).body;
    const materialized = (
      await post(`/api/release-tracks/${virtual.id}/virtual/snapshots/create`, {}, 201)
    ).body;
    expect(materialized.composition_resolution.component_snapshots[0]).toMatchObject({
      track_id: component.id,
      resolved_version: '1.0',
    });

    // Advance the component after materialization. Virtual release provenance
    // must remain tied to the frozen component resolution, not current state.
    await post(`/api/release-tracks/${component.id}/contents`, {
      x_mitre_contents: [{ obj_ref: member.stix.id, obj_modified: member.stix.modified }],
    });
    const secondComponentRelease = await post(
      `/api/release-tracks/${component.id}/snapshots/latest/release`,
      {},
    );
    expect(secondComponentRelease.body.version).toBe('1.1');

    const releasePath =
      `/api/release-tracks/${virtual.id}/snapshots/` +
      `${encodeURIComponent(materialized.modified)}/release`;
    const preview = await get(`${releasePath}/preview?format=workbench`);
    expect(preview.body.version_history.at(-1).component_versions).toEqual({
      [component.id]: '1.0',
    });

    const unchanged = await get(
      `/api/release-tracks/${virtual.id}/snapshots/${encodeURIComponent(materialized.modified)}`,
    );
    expect(unchanged.body.version_history).toEqual([]);

    const released = await post(releasePath, {});
    expect(released.body.version_history.at(-1).component_versions).toEqual({
      [component.id]: '1.0',
    });
  });

  it('validates component release provenance at the persistence boundary', async function () {
    const track = await createTrack('Provenance Validation', 'virtual');
    const created = new Date(track.modified);
    const historyEntry = {
      version: '1.0',
      tagged_at: new Date(created.getTime() + 1000),
      tagged_by: 'system',
      snapshot_id: new Date(created.getTime() + 1000),
      summary: { members_count: 0, quarantine_count: 0 },
    };

    await expect(
      dynamicRepo.saveSnapshot(track.id, {
        ...snapshotBase(track),
        modified: historyEntry.snapshot_id,
        version: '1.0',
        version_history: [
          {
            ...historyEntry,
            component_versions: { [track.id]: 'latest' },
          },
        ],
      }),
    ).rejects.toMatchObject({
      name: 'DatabaseError',
      details: expect.stringContaining('not a valid version'),
    });

    const invalidKeyModified = new Date(created.getTime() + 2000);
    await expect(
      dynamicRepo.saveSnapshot(track.id, {
        ...snapshotBase(track),
        modified: invalidKeyModified,
        version: '1.1',
        version_history: [
          {
            ...historyEntry,
            version: '1.1',
            snapshot_id: invalidKeyModified,
            component_versions: { 'Component Display Name': '1.0' },
          },
        ],
      }),
    ).rejects.toMatchObject({
      name: 'DatabaseError',
      details: expect.stringContaining('Component version keys must be valid release track IDs'),
    });

    const missingValueModified = new Date(created.getTime() + 3000);
    await expect(
      dynamicRepo.saveSnapshot(track.id, {
        ...snapshotBase(track),
        modified: missingValueModified,
        version: '1.2',
        version_history: [
          {
            ...historyEntry,
            version: '1.2',
            snapshot_id: missingValueModified,
            component_versions: { [track.id]: null },
          },
        ],
      }),
    ).rejects.toMatchObject({
      name: 'DatabaseError',
      details: expect.stringContaining('is required'),
    });
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

  it('compares the latest virtual draft with its preceding tagged release', async function () {
    const track = await createTrack('Virtual Release Preview', 'virtual');
    const created = new Date(track.modified);
    const taggedModified = new Date(created.getTime() + 1000);
    const draftModified = new Date(created.getTime() + 2000);
    const oldRevision = new Date(created.getTime() - 2000);
    const newRevision = new Date(created.getTime() - 1000);

    await dynamicRepo.saveSnapshot(track.id, {
      ...snapshotBase(track),
      modified: taggedModified,
      version: '1.0',
      members: [
        memberEntry(virtualObjectRefs[0], oldRevision),
        memberEntry(virtualObjectRefs[1], oldRevision),
      ],
      quarantine: [quarantineEntry(virtualObjectRefs[3], oldRevision, track.id)],
    });
    await dynamicRepo.saveSnapshot(track.id, {
      ...snapshotBase(track),
      modified: draftModified,
      version: null,
      members: [
        memberEntry(virtualObjectRefs[0], newRevision),
        memberEntry(virtualObjectRefs[2], newRevision),
      ],
      quarantine: [],
      composition_resolution: compositionResolution(draftModified),
    });

    const preview = await get(`/api/release-tracks/${track.id}/snapshots/latest/release/preview`);
    expect(preview.body).toMatchObject({
      type: 'virtual',
      source_snapshot_modified: draftModified.toISOString(),
      version: '1.1',
      previous_release: {
        version: '1.0',
        modified: taggedModified.toISOString(),
      },
      before: { members_count: 2, quarantine_count: 1 },
      after: { members_count: 2, quarantine_count: 0 },
      changes: {
        new_count: 1,
        updated_count: 1,
        removed_count: 1,
        quarantined_count: 0,
      },
    });
    expect(preview.body.before).not.toHaveProperty('staged_count');
    expect(preview.body.before).not.toHaveProperty('candidates_count');

    const unchanged = await get(
      `/api/release-tracks/${track.id}/snapshots/${encodeURIComponent(draftModified.toISOString())}`,
    );
    expect(unchanged.body.version).toBeNull();
  });

  it('compares a historical virtual draft with the tagged release that preceded it', async function () {
    const track = await createTrack('Historical Virtual Release Preview', 'virtual');
    const created = new Date(track.modified);
    const firstTaggedModified = new Date(created.getTime() + 1000);
    const historicalDraftModified = new Date(created.getTime() + 2000);
    const laterTaggedModified = new Date(created.getTime() + 3000);
    const oldRevision = new Date(created.getTime() - 2000);
    const newRevision = new Date(created.getTime() - 1000);

    await dynamicRepo.saveSnapshot(track.id, {
      ...snapshotBase(track),
      modified: firstTaggedModified,
      version: '1.0',
      members: [memberEntry(virtualObjectRefs[0], oldRevision)],
    });
    await dynamicRepo.saveSnapshot(track.id, {
      ...snapshotBase(track),
      modified: historicalDraftModified,
      version: null,
      members: [memberEntry(virtualObjectRefs[0], newRevision)],
      composition_resolution: compositionResolution(historicalDraftModified),
    });
    await dynamicRepo.saveSnapshot(track.id, {
      ...snapshotBase(track),
      modified: laterTaggedModified,
      version: '2.0',
      members: [memberEntry(virtualObjectRefs[3], newRevision)],
    });

    const preview = await get(
      `/api/release-tracks/${track.id}/snapshots/${encodeURIComponent(historicalDraftModified.toISOString())}/release/preview?version=3.0`,
    );
    expect(preview.body.previous_release).toEqual({
      version: '1.0',
      modified: firstTaggedModified.toISOString(),
    });
    expect(preview.body.before).toEqual({ members_count: 1, quarantine_count: 0 });
    expect(preview.body.after).toEqual({ members_count: 1, quarantine_count: 0 });
    expect(preview.body.changes).toEqual({
      new_count: 0,
      updated_count: 1,
      removed_count: 0,
      quarantined_count: 0,
    });
  });

  it('exposes virtual-only draft operations under the explicit virtual namespace', async function () {
    const standard = await createTrack('Virtual Namespace Guard');

    await request(app)
      .put(`/api/release-tracks/${standard.id}/virtual/composition`)
      .send({
        component_tracks: [
          {
            track_id: standard.id,
            resolution_strategy: 'latest_tagged',
          },
        ],
      })
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(400);

    await post(`/api/release-tracks/${standard.id}/virtual/snapshots/create`, {}, 400);
    // The removed path now falls through to the generic :modified retrieval
    // route, where "preview" is rejected as a malformed timestamp.
    await get(`/api/release-tracks/${standard.id}/snapshots/preview`, 400);
    await post(`/api/release-tracks/${standard.id}/snapshots/create`, {}, 405);

    await request(app)
      .put(`/api/release-tracks/${standard.id}/composition`)
      .send({
        component_tracks: [
          {
            track_id: standard.id,
            resolution_strategy: 'latest_tagged',
          },
        ],
      })
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(404);
  });

  it('requires virtual composition to be materialized before preview or release', async function () {
    const member = (
      await post('/api/techniques', buildTechnique('Virtual Materialization Member'), 201)
    ).body;
    const component = await createTrack('Virtual Materialization Component');
    await post(`/api/release-tracks/${component.id}/contents`, {
      x_mitre_contents: [{ obj_ref: member.stix.id, obj_modified: member.stix.modified }],
    });
    await post(`/api/release-tracks/${component.id}/snapshots/latest/release`, {});

    const virtual = (
      await post(
        '/api/release-tracks/new',
        {
          name: 'Virtual Materialization Lifecycle',
          type: 'virtual',
          composition: {
            component_tracks: [
              {
                track_id: component.id,
                resolution_strategy: 'latest_tagged',
                priority: 1,
              },
            ],
          },
        },
        201,
      )
    ).body;
    const materialized = (
      await post(`/api/release-tracks/${virtual.id}/virtual/snapshots/create`, {}, 201)
    ).body;
    expect(materialized.members).toHaveLength(1);
    expect(materialized.composition_resolution).toBeDefined();

    const compositionDraft = await request(app)
      .put(`/api/release-tracks/${virtual.id}/virtual/composition`)
      .send({
        component_tracks: [
          {
            track_id: component.id,
            resolution_strategy: 'latest_tagged',
            priority: 1,
          },
        ],
      })
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(200);

    expect(compositionDraft.body.members).toEqual([]);
    expect(compositionDraft.body.quarantine).toEqual([]);
    expect(compositionDraft.body.composition_resolution).toBeNull();

    await get(`/api/release-tracks/${virtual.id}/snapshots/latest/release/preview`, 409);
    await post(`/api/release-tracks/${virtual.id}/snapshots/latest/release`, {}, 409);

    const rematerialized = (
      await post(`/api/release-tracks/${virtual.id}/virtual/snapshots/create`, {}, 201)
    ).body;
    expect(rematerialized.members).toHaveLength(1);
    expect(rematerialized.composition_resolution).toBeDefined();

    const preview = await get(`/api/release-tracks/${virtual.id}/snapshots/latest/release/preview`);
    expect(preview.body.releasable).toBe(true);
  });

  it('rejects generic contents replacement for virtual tracks', async function () {
    const virtual = await createTrack('Virtual Contents Guard', 'virtual');
    const contents = {
      x_mitre_contents: [
        {
          obj_ref: virtualObjectRefs[0],
          obj_modified: new Date().toISOString(),
        },
      ],
    };

    await post(`/api/release-tracks/${virtual.id}/contents`, contents, 400);
    await post(
      `/api/release-tracks/${virtual.id}/snapshots/${encodeURIComponent(virtual.modified)}/contents`,
      contents,
      400,
    );

    const latest = await get(`/api/release-tracks/${virtual.id}/snapshots/latest`);
    expect(latest.body.modified).toBe(virtual.modified);
    expect(latest.body.members).toEqual([]);
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
      object_refs: [{ id: revisionB.stix.id, modified: 'latest' }],
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
