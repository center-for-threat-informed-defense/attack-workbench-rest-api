'use strict';

const request = require('supertest');
const { expect } = require('expect');
const sinon = require('sinon');

const config = require('../../../config/config');
const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');
const login = require('../../shared/login');
const { DatabaseError } = require('../../../exceptions');
const AttackObject = require('../../../models/attack-object-model');
const dynamicRepo = require('../../../repository/release-tracks/release-track-dynamic.repository');
const registryRepo = require('../../../repository/release-tracks/release-track-registry.repository');
const {
  ReleaseTrackContentManifest,
  ReleaseTrackContentManifestEntry,
} = require('../../../models/release-tracks/release-track-content-manifest-model');
const { releaseExactMembers } = require('./release-track-test-helpers');

const workflowTiers = ['candidates', 'staged', 'quarantine'];
const markingDefinitionId = 'marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168';

function json(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildObject(type, name, previous) {
  const modified = previous
    ? new Date(new Date(previous.stix.modified).getTime() + 1000).toISOString()
    : new Date().toISOString();
  return {
    workspace: { workflow: { state: 'work-in-progress' } },
    stix: {
      id: previous?.stix.id,
      ...(previous ? { created_by_ref: previous.stix.created_by_ref } : {}),
      created: previous?.stix.created || modified,
      modified,
      type,
      name,
      ...(type === 'x-mitre-detection-strategy' ? {} : { description: `${name} description` }),
      spec_version: '2.1',
      object_marking_refs: [markingDefinitionId],
      x_mitre_domains: ['enterprise-attack'],
      x_mitre_version: '1.0',
    },
  };
}

describe('Release-track workflow references after object deletion', function () {
  let app;
  let passportCookie;
  let analytic;

  before(async function () {
    await database.initializeConnection();
    await databaseConfiguration.checkSystemConfiguration();
    config.validateRequests.withAttackDataModel = true;
    config.validateRequests.withOpenApi = true;
    app = await require('../../../index').initializeApp();
    passportCookie = await login.loginAnonymous(app);

    const body = buildObject('x-mitre-analytic', 'Workflow Deletion Analytic');
    body.stix.x_mitre_platforms = ['Windows'];
    analytic = await post('/api/analytics', body, 201);
  });

  after(async function () {
    await database.closeConnection();
  });

  function api(method, path, body, status) {
    const call = request(app)
      [method](path)
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`);
    if (body !== undefined) call.send(body);
    return call.expect(status);
  }

  async function post(path, body, status = 200) {
    return (await api('post', path, body, status)).body;
  }

  async function get(path, status = 200) {
    return (await api('get', path, undefined, status)).body;
  }

  async function createStrategy(name, previous) {
    const body = buildObject('x-mitre-detection-strategy', name, previous);
    body.stix.x_mitre_analytic_refs = [analytic.stix.id];
    return post('/api/detection-strategies', body, 201);
  }

  async function createTrack(name, type = 'standard') {
    return post('/api/release-tracks/new', { name, type }, 201);
  }

  function revisionPath(object) {
    return `/api/detection-strategies/${object.stix.id}/modified/${object.stix.modified}`;
  }

  async function addCandidates(track, objects, dynamic = false) {
    return post(`/api/release-tracks/${track.id}/candidates`, {
      object_refs: objects.map((object) => ({
        id: object.stix.id,
        ...(dynamic ? {} : { modified: object.stix.modified }),
      })),
    });
  }

  async function stage(track, objects, dynamic = false) {
    await addCandidates(track, objects, dynamic);
    return post(`/api/release-tracks/${track.id}/candidates/promote`, {
      object_refs: objects.map((object) => object.stix.id),
    });
  }

  async function seedQuarantine(track, objects, sourceTrack) {
    // Isolate workflow cleanup from component member/manifest protection.
    // These fixtures represent retained virtual workflow metadata, not a new
    // composition whose component members would correctly prevent deletion.
    const snapshot = await dynamicRepo.getLatestSnapshot(track.id);
    await dynamicRepo.updateSnapshot(track.id, snapshot.modified, {
      $set: {
        quarantine: objects.map((object) => ({
          object_ref: object.stix.id,
          object_modified: object.stix.modified,
          source_track_id: sourceTrack.id,
          source_track_name: sourceTrack.name,
          conflict_reason: 'conflicting object revisions',
        })),
      },
    });
  }

  async function retainHistoricalSnapshot(track, overrides = {}) {
    // Normal standard writes roll one draft. Persist a separate successor to
    // exercise retained historical metadata without releasing workflow refs.
    const current = await dynamicRepo.getLatestSnapshot(track.id);
    const next = { ...current, ...overrides };
    delete next._id;
    delete next.__v;
    next.modified = new Date(new Date(current.modified).getTime() + 1000);
    await dynamicRepo.saveSnapshot(track.id, next);
    const snapshots = await dynamicRepo.getAllSnapshots(track.id);
    await registryRepo.updateByTrackId(track.id, {
      latest_snapshot_modified: next.modified,
      snapshot_count: snapshots.pagination.total,
    });
  }

  async function capture(track) {
    return json({
      snapshots: (await dynamicRepo.getAllSnapshots(track.id)).data,
      manifests: await ReleaseTrackContentManifest.find({ track_id: track.id })
        .sort({ manifest_id: 1 })
        .lean()
        .exec(),
      entries: await ReleaseTrackContentManifestEntry.find({ track_id: track.id })
        .sort({ manifest_id: 1, revision_key: 1, kind: 1 })
        .lean()
        .exec(),
    });
  }

  async function expectCleanup(track, before, object, { exactOnly = false } = {}) {
    const expected = structuredClone(before);
    for (const snapshot of expected.snapshots) {
      for (const tier of workflowTiers) {
        if (!snapshot[tier]) continue;
        snapshot[tier] = snapshot[tier].filter((entry) => {
          if (entry.object_ref !== object.stix.id) return true;
          return exactOnly && entry.object_modified !== object.stix.modified;
        });
      }
    }
    // Exact document equality also protects members, snapshot IDs/timestamps,
    // release versions, manifest pointers, and unrelated workflow metadata.
    expect(await capture(track)).toEqual(expected);
    for (const selector of ['latest', ...expected.snapshots.map((snapshot) => snapshot.modified)]) {
      const snapshot = await get(
        `/api/release-tracks/${track.id}/snapshots/${encodeURIComponent(selector)}`,
      );
      for (const tier of workflowTiers) {
        const deleted = (snapshot[tier] || []).filter(
          (entry) =>
            entry.object_ref === object.stix.id &&
            (!exactOnly || entry.object_modified === object.stix.modified),
        );
        expect(deleted).toEqual([]);
      }
    }
  }

  it('keeps latest and historical snapshots readable after deleting a candidate detection strategy', async function () {
    const deleted = await createStrategy('Deleted Candidate Strategy');
    const retained = await createStrategy('Retained Candidate Strategy');
    const member = await createStrategy('Retained Released Strategy');
    const track = await createTrack('Candidate Strategy Deletion');
    await releaseExactMembers(app, passportCookie, track.id, [member]);
    await addCandidates(track, [deleted, retained]);
    await retainHistoricalSnapshot(track);
    const before = await capture(track);

    await api('delete', `/api/detection-strategies/${deleted.stix.id}`, undefined, 204);

    await get(revisionPath(deleted), 404);
    await expectCleanup(track, before, deleted);
    const retainedAfter = await get(revisionPath(retained));
    expect(retainedAfter.workspace.release_tracks).toContainEqual({
      id: track.id,
      type: 'standard',
      tier: 'candidates',
      status: 'work-in-progress',
    });
  });

  it('cleans every workflow tier and registered track even without current object backrefs', async function () {
    const deleted = await createStrategy('Deleted Across Workflow Tiers');
    const retained = await createStrategy('Retained Across Workflow Tiers');
    const candidates = await createTrack('Historical Candidate Deletion');
    const staged = await createTrack('Staged Strategy Deletion');
    const quarantine = await createTrack('Quarantined Strategy Deletion', 'virtual');
    await addCandidates(candidates, [deleted, retained]);
    const current = await dynamicRepo.getLatestSnapshot(candidates.id);
    await retainHistoricalSnapshot(candidates, {
      candidates: current.candidates.filter((entry) => entry.object_ref !== deleted.stix.id),
    });
    await stage(staged, [deleted, retained]);
    await retainHistoricalSnapshot(staged);
    await seedQuarantine(quarantine, [deleted, retained], candidates);
    await retainHistoricalSnapshot(quarantine);

    // Backrefs describe current snapshots only and can be absent after imports.
    // They must not be the index used to discover historical workflow refs.
    await AttackObject.collection.updateMany(
      { 'stix.id': deleted.stix.id },
      { $unset: { 'workspace.release_tracks': '' } },
    );
    const tracks = [candidates, staged, quarantine];
    const before = await Promise.all(tracks.map(capture));

    await api('delete', `/api/detection-strategies/${deleted.stix.id}`, undefined, 204);

    await get(revisionPath(deleted), 404);
    for (let index = 0; index < tracks.length; index++) {
      await expectCleanup(tracks[index], before[index], deleted);
    }
    await get(revisionPath(retained));
  });

  for (const deletedRevision of ['newest', 'older']) {
    it(`deletes only the ${deletedRevision} exact revision and reconciles retained latest selectors`, async function () {
      const older = await createStrategy(`Exact Revision ${deletedRevision} A`);
      const newer = await createStrategy(`Exact Revision ${deletedRevision} B`, older);
      const deleted = deletedRevision === 'newest' ? newer : older;
      const survivor = deletedRevision === 'newest' ? older : newer;
      const keptExact = await createTrack(`Kept Exact ${deletedRevision}`);
      const removedExact = await createTrack(`Removed Exact ${deletedRevision}`);
      const latestCandidate = await createTrack(`Latest Candidate ${deletedRevision}`);
      const latestStaged = await createTrack(`Latest Staged ${deletedRevision}`);
      const quarantine = await createTrack(`Exact Quarantine ${deletedRevision}`, 'virtual');
      await addCandidates(keptExact, [survivor]);
      await stage(removedExact, [deleted]);
      await addCandidates(latestCandidate, [newer], true);
      await stage(latestStaged, [newer], true);
      await seedQuarantine(quarantine, [older, newer], keptExact);
      const tracks = [keptExact, removedExact, latestCandidate, latestStaged, quarantine];
      for (const track of tracks) await retainHistoricalSnapshot(track);
      const before = await Promise.all(tracks.map(capture));

      await api('delete', revisionPath(deleted), undefined, 204);

      await get(revisionPath(deleted), 404);
      for (let index = 0; index < tracks.length; index++) {
        await expectCleanup(tracks[index], before[index], deleted, { exactOnly: true });
      }
      const survivingObject = await get(revisionPath(survivor));
      expect(survivingObject.workspace.release_tracks).toEqual(
        expect.arrayContaining([
          { id: keptExact.id, type: 'standard', tier: 'candidates', status: 'work-in-progress' },
          {
            id: latestCandidate.id,
            type: 'standard',
            tier: 'candidates',
            status: 'work-in-progress',
          },
          { id: latestStaged.id, type: 'standard', tier: 'staged', status: 'work-in-progress' },
        ]),
      );
      expect(
        survivingObject.workspace.release_tracks.some((entry) => entry.id === removedExact.id),
      ).toBe(false);
      const versions = await get(`/api/detection-strategies/${survivor.stix.id}?versions=all`);
      expect(versions.map((version) => version.stix.modified)).toEqual([survivor.stix.modified]);
      for (const [track, tier] of [
        [latestCandidate, 'candidates'],
        [latestStaged, 'staged'],
      ]) {
        const snapshot = await get(`/api/release-tracks/${track.id}/snapshots/latest`);
        expect(snapshot[tier]).toEqual([
          expect.objectContaining({ object_ref: survivor.stix.id, object_modified: 'latest' }),
        ]);
      }
    });
  }

  it('removes dynamic latest selectors when the final revision is deleted', async function () {
    const deleted = await createStrategy('Last Revision Strategy');
    const retained = await createStrategy('Unrelated Latest Strategy');
    const candidateTrack = await createTrack('Last Revision Candidate');
    const stagedTrack = await createTrack('Last Revision Staged');
    await addCandidates(candidateTrack, [deleted, retained], true);
    await stage(stagedTrack, [deleted, retained], true);
    const tracks = [candidateTrack, stagedTrack];
    for (const track of tracks) await retainHistoricalSnapshot(track);
    const before = await Promise.all(tracks.map(capture));

    await api('delete', revisionPath(deleted), undefined, 204);

    await get(revisionPath(deleted), 404);
    for (let index = 0; index < tracks.length; index++) {
      await expectCleanup(tracks[index], before[index], deleted);
    }
    expect((await get(revisionPath(retained))).workspace.release_tracks).toHaveLength(2);
  });

  for (const failedOperation of ['removeWorkflowObjectReferences', 'getLatestSnapshot']) {
    it(`fails DELETE when workflow cleanup ${failedOperation} fails`, async function () {
      const object = await createStrategy(`Failed Cleanup ${failedOperation}`);
      const track = await createTrack(`Failed Cleanup ${failedOperation}`);
      await addCandidates(track, [object]);
      const before = await capture(track);
      const failure = sinon
        .stub(dynamicRepo, failedOperation)
        .rejects(new DatabaseError(new Error('injected workflow cleanup failure')));

      try {
        await api('delete', `/api/detection-strategies/${object.stix.id}`, undefined, 500);
        expect(failure.called).toBe(true);
      } finally {
        failure.restore();
      }

      expect((await get(revisionPath(object))).stix).toEqual(object.stix);
      const after = await capture(track);
      expect(after.manifests).toEqual(before.manifests);
      expect(after.entries).toEqual(before.entries);
      if (failedOperation === 'removeWorkflowObjectReferences') {
        expect(after.snapshots).toEqual(before.snapshots);
      }
      await get(`/api/release-tracks/${track.id}/snapshots/latest`);
    });
  }

  for (const protection of ['member', 'manifest']) {
    it(`rejects ${protection}-protected deletion before changing any workflow references`, async function () {
      const protectedObject = await createStrategy(`Protected ${protection} Strategy`);
      const releaseTrack = await createTrack(`Protected ${protection} Release`);
      let root = protectedObject;
      if (protection === 'manifest') {
        const body = buildObject('attack-pattern', 'Manifest Link Root');
        body.stix.description = `See (LinkById: ${protectedObject.workspace.attack_id}).`;
        body.stix.x_mitre_is_subtechnique = false;
        body.stix.x_mitre_platforms = ['Windows'];
        body.stix.kill_chain_phases = [
          { kill_chain_name: 'mitre-attack', phase_name: 'persistence' },
        ];
        root = await post('/api/techniques', body, 201);
      }
      await releaseExactMembers(app, passportCookie, releaseTrack.id, [root]);
      const workflowTrack = await createTrack(`Protected ${protection} Workflow`);
      await addCandidates(workflowTrack, [protectedObject]);
      await retainHistoricalSnapshot(workflowTrack);
      const tracks = [releaseTrack, workflowTrack];
      const before = await Promise.all(tracks.map(capture));
      if (protection === 'manifest') {
        expect(before[0].entries).toContainEqual(
          expect.objectContaining({
            kind: 'link_target',
            object_ref: protectedObject.stix.id,
            object_modified: protectedObject.stix.modified,
          }),
        );
        expect(before[0].snapshots[0].members).not.toContainEqual(
          expect.objectContaining({ object_ref: protectedObject.stix.id }),
        );
      }

      for (const path of [
        `/api/detection-strategies/${protectedObject.stix.id}`,
        revisionPath(protectedObject),
      ]) {
        const rejected = await api('delete', path, undefined, 409);
        if (protection === 'member') {
          expect(rejected.body.release_tracks).toContain(releaseTrack.id);
        } else {
          expect(rejected.body.snapshot_graph_pins.length).toBeGreaterThan(0);
        }
        expect((await get(revisionPath(protectedObject))).stix).toEqual(protectedObject.stix);
        for (let index = 0; index < tracks.length; index++) {
          expect(await capture(tracks[index])).toEqual(before[index]);
          await get(`/api/release-tracks/${tracks[index].id}/snapshots/latest`);
        }
      }
    });
  }
});
