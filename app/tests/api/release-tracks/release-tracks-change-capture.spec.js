const request = require('supertest');
const { expect } = require('expect');

const config = require('../../../config/config');
const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');
const login = require('../../shared/login');
const { releaseExactMembers } = require('./release-track-test-helpers');

const logger = require('../../../lib/logger');
logger.level = 'debug';

const staticMarkingDefinitionId = 'marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168';

function buildTechnique(name) {
  const timestamp = new Date().toISOString();
  return {
    workspace: {
      workflow: {
        state: 'work-in-progress',
      },
    },
    stix: {
      created: timestamp,
      modified: timestamp,
      name,
      description: `${name} description`,
      spec_version: '2.1',
      type: 'attack-pattern',
      object_marking_refs: [staticMarkingDefinitionId],
      kill_chain_phases: [{ kill_chain_name: 'mitre-attack', phase_name: 'persistence' }],
      x_mitre_is_subtechnique: false,
      x_mitre_domains: ['enterprise-attack'],
      x_mitre_platforms: ['Windows'],
      x_mitre_version: '1.0',
    },
  };
}

// Persisted STIX revisions are immutable regardless of tier. Workspace-only
// PUT remains available and must not masquerade as a content revision.
// Revoking a tracked object still creates and enrolls a new revision.
describe('Release Track Change Capture (PUT/DELETE/revoke) API', function () {
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

  async function postObject(path, body, expectedStatus = 201) {
    const res = await request(app)
      .post(path)
      .send(body)
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(expectedStatus);
    return res.body;
  }

  async function getJson(path, expectedStatus = 200) {
    const res = await request(app)
      .get(path)
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(expectedStatus);
    return res.body;
  }

  async function getTechniqueVersion(stixId, modified) {
    return getJson(`/api/techniques/${stixId}/modified/${modified}`);
  }

  function putTechnique(technique, body) {
    return request(app)
      .put(`/api/techniques/${technique.stix.id}/modified/${technique.stix.modified}`)
      .send(body)
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`);
  }

  async function createTrack(name) {
    const res = await postObject('/api/release-tracks/new', { name, type: 'standard' });
    return res.id;
  }

  async function addCandidate(trackId, technique) {
    return postObject(
      `/api/release-tracks/${trackId}/candidates`,
      { object_refs: [{ id: technique.stix.id, modified: technique.stix.modified }] },
      200,
    );
  }

  async function setMembers(trackId, technique) {
    return releaseExactMembers(app, passportCookie, trackId, [technique]);
  }

  async function latestSnapshotModified(trackId) {
    const snapshot = await getJson(`/api/release-tracks/${trackId}/snapshots/latest`);
    return snapshot.modified;
  }

  function entryForTrack(object, trackId) {
    return (object.workspace.release_tracks || []).find((e) => e.id === trackId);
  }

  function buildUpdateBody(technique, name) {
    const update = buildTechnique(name);
    update.stix.id = technique.stix.id;
    update.stix.created = technique.stix.created;
    update.stix.modified = technique.stix.modified;
    return update;
  }

  describe('members-pinned revisions are immutable in place', function () {
    let trackId;
    let technique;

    before(async function () {
      technique = await postObject('/api/techniques', buildTechnique('Capture Member'));
      trackId = await createTrack('Capture Member Track');
      await setMembers(trackId, technique);
    });

    it('rejects a PUT of a members-pinned revision with 409', async function () {
      const res = await putTechnique(
        technique,
        buildUpdateBody(technique, 'Capture Member (edited)'),
      ).expect(409);
      expect(res.text).toContain('Persisted STIX revisions are immutable');

      const retrieved = await getTechniqueVersion(technique.stix.id, technique.stix.modified);
      expect(retrieved.stix.name).toBe('Capture Member');
      expect(entryForTrack(retrieved, trackId)).toEqual({
        id: trackId,
        type: 'standard',
        tier: 'members',
        status: 'reviewed',
      });
    });

    it('rejects a DELETE of a members-pinned revision with 409', async function () {
      const res = await request(app)
        .delete(`/api/techniques/${technique.stix.id}/modified/${technique.stix.modified}`)
        .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
        .expect(409);
      expect(res.text).toContain('members tier');

      await getTechniqueVersion(technique.stix.id, technique.stix.modified);
    });

    it('rejects a DELETE of all versions when any revision is members-pinned', async function () {
      // Add a second (untracked) revision — the delete-all must still be
      // rejected because the first revision is members-pinned
      const revisionB = buildTechnique('Capture Member v2');
      revisionB.stix.id = technique.stix.id;
      revisionB.stix.created = technique.stix.created;
      revisionB.stix.modified = new Date(
        new Date(technique.stix.modified).getTime() + 60000,
      ).toISOString();
      await postObject('/api/techniques', revisionB);

      const res = await request(app)
        .delete(`/api/techniques/${technique.stix.id}`)
        .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
        .expect(409);
      expect(res.text).toContain('members tier');

      await getTechniqueVersion(technique.stix.id, technique.stix.modified);
    });
  });

  describe('candidate/staged revision immutability', function () {
    it('rejects a candidate STIX edit without changing its pin or review status', async function () {
      const technique = await postObject('/api/techniques', buildTechnique('Capture Candidate'));
      const trackId = await createTrack('Capture Candidate Track');
      await addCandidate(trackId, technique);
      await postObject(
        `/api/release-tracks/${trackId}/candidates/review`,
        { from: 'work-in-progress', to: 'awaiting-review' },
        200,
      );

      await putTechnique(
        technique,
        buildUpdateBody(technique, 'Capture Candidate (edited)'),
      ).expect(409);

      const { candidates } = await getJson(`/api/release-tracks/${trackId}/candidates`);
      expect(candidates).toHaveLength(1);
      expect(candidates[0].object_status).toBe('awaiting-review');
      expect(new Date(candidates[0].object_modified).toISOString()).toBe(technique.stix.modified);
    });

    it('allows workspace-only PUT without cloning the rolling draft', async function () {
      const technique = await postObject('/api/techniques', buildTechnique('Capture Workspace'));
      const trackId = await createTrack('Capture Workspace Track');
      await addCandidate(trackId, technique);
      const before = await latestSnapshotModified(trackId);
      const workspaceUpdate = JSON.parse(JSON.stringify(technique));
      workspaceUpdate.workspace.workflow.state = 'awaiting-review';
      await putTechnique(technique, workspaceUpdate).expect(200);

      const after = await latestSnapshotModified(trackId);
      expect(after).toBe(before);
    });

    it('still allows DELETE of a candidate-pinned revision', async function () {
      const technique = await postObject('/api/techniques', buildTechnique('Capture Del Cand'));
      const trackId = await createTrack('Capture Del Cand Track');
      await addCandidate(trackId, technique);

      await request(app)
        .delete(`/api/techniques/${technique.stix.id}/modified/${technique.stix.modified}`)
        .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
        .expect(204);
    });
  });

  describe('revocation reaches the release track', function () {
    async function revokeTechnique(revoked, revoker) {
      const res = await request(app)
        .post(`/api/techniques/${revoked.stix.id}/revoke`)
        .send({ revoking: { stixId: revoker.stix.id, modified: revoker.stix.modified } })
        .set('Accept', 'application/json')
        .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
        .expect(200);
      return res.body;
    }

    it('enrolls the revoked revision as a candidate in tracks where the object is a member', async function () {
      const technique = await postObject('/api/techniques', buildTechnique('Capture Revoke M'));
      const revoker = await postObject('/api/techniques', buildTechnique('Capture Revoker M'));
      const trackId = await createTrack('Capture Revoke Member Track');
      await setMembers(trackId, technique);

      const result = await revokeTechnique(technique, revoker);

      // The revoke response carries the revoked revision's backref
      expect(result.primary.stix.revoked).toBe(true);
      expect(entryForTrack(result.primary, trackId)).toEqual({
        id: trackId,
        type: 'standard',
        tier: 'candidates',
        status: 'work-in-progress',
      });

      // The member revision keeps its pin; the revoked revision is a candidate
      const memberRevision = await getTechniqueVersion(technique.stix.id, technique.stix.modified);
      expect(entryForTrack(memberRevision, trackId)).toEqual({
        id: trackId,
        type: 'standard',
        tier: 'members',
        status: 'reviewed',
      });
      const revokedRevision = await getTechniqueVersion(
        technique.stix.id,
        result.primary.stix.modified,
      );
      expect(entryForTrack(revokedRevision, trackId)).toEqual({
        id: trackId,
        type: 'standard',
        tier: 'candidates',
        status: 'work-in-progress',
      });
    });

    it('moves a candidate pin to the revoked revision', async function () {
      const technique = await postObject('/api/techniques', buildTechnique('Capture Revoke C'));
      const revoker = await postObject('/api/techniques', buildTechnique('Capture Revoker C'));
      const trackId = await createTrack('Capture Revoke Candidate Track');
      await addCandidate(trackId, technique);

      const result = await revokeTechnique(technique, revoker);

      const oldRevision = await getTechniqueVersion(technique.stix.id, technique.stix.modified);
      expect(entryForTrack(oldRevision, trackId)).toBeUndefined();
      expect(entryForTrack(result.primary, trackId)).toEqual({
        id: trackId,
        type: 'standard',
        tier: 'candidates',
        status: 'work-in-progress',
      });
    });
  });

  describe('technique conversion reaches the release track', function () {
    async function convert(stixId, path, body) {
      const res = await request(app)
        .post(`/api/techniques/${stixId}/${path}`)
        .send(body)
        .set('Accept', 'application/json')
        .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
        .expect(200);
      return res.body;
    }

    it('moves a candidate pin to the converted revision (convert-to-subtechnique)', async function () {
      const parent = await postObject('/api/techniques', buildTechnique('Capture Conv Parent'));
      const technique = await postObject('/api/techniques', buildTechnique('Capture Conv Child'));
      const trackId = await createTrack('Capture Conv Candidate Track');
      await addCandidate(trackId, technique);

      const result = await convert(technique.stix.id, 'convert-to-subtechnique', {
        parentTechniqueAttackId: parent.workspace.attack_id,
      });

      // The conversion response carries the re-pinned backref
      expect(result.primary.stix.x_mitre_is_subtechnique).toBe(true);
      expect(entryForTrack(result.primary, trackId)).toEqual({
        id: trackId,
        type: 'standard',
        tier: 'candidates',
        status: 'work-in-progress',
      });

      // The dynamic pin now resolves to the converted revision.
      const oldRevision = await getTechniqueVersion(technique.stix.id, technique.stix.modified);
      expect(entryForTrack(oldRevision, trackId)).toBeUndefined();
      const { candidates } = await getJson(`/api/release-tracks/${trackId}/candidates`);
      expect(candidates).toHaveLength(1);
      expect(candidates[0].object_modified).toBe('latest');
    });

    it('enrolls the converted revision as a candidate in member tracks (convert-to-technique)', async function () {
      const parent = await postObject('/api/techniques', buildTechnique('Capture Conv2 Parent'));
      const technique = await postObject('/api/techniques', buildTechnique('Capture Conv2 Child'));

      // Make it a subtechnique first (untracked at this point — no sync)
      const subtechniqueResult = await convert(technique.stix.id, 'convert-to-subtechnique', {
        parentTechniqueAttackId: parent.workspace.attack_id,
      });
      const subtechniqueRevision = subtechniqueResult.primary;

      const trackId = await createTrack('Capture Conv Member Track');
      await setMembers(trackId, subtechniqueRevision);

      const result = await convert(technique.stix.id, 'convert-to-technique', {});

      // The converted revision is enrolled as a candidate; the member pin
      // stays on the pre-conversion revision
      expect(result.primary.stix.x_mitre_is_subtechnique).toBe(false);
      expect(entryForTrack(result.primary, trackId)).toEqual({
        id: trackId,
        type: 'standard',
        tier: 'candidates',
        status: 'work-in-progress',
      });
      const memberRevision = await getTechniqueVersion(
        subtechniqueRevision.stix.id,
        subtechniqueRevision.stix.modified,
      );
      expect(entryForTrack(memberRevision, trackId)).toEqual({
        id: trackId,
        type: 'standard',
        tier: 'members',
        status: 'reviewed',
      });
    });
  });

  after(async function () {
    await database.closeConnection();
  });
});
