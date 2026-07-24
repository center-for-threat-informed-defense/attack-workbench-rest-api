const request = require('supertest');
const { expect } = require('expect');

const config = require('../../../config/config');
const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');
const login = require('../../shared/login');
const AttackObject = require('../../../models/attack-object-model');
const snapshotService = require('../../../services/release-tracks/snapshot-service');

const logger = require('../../../lib/logger');
logger.level = 'debug';

function buildTechnique(name, description) {
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
      description,
      spec_version: '2.1',
      type: 'attack-pattern',
      object_marking_refs: ['marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168'],
      created_by_ref: 'identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5',
      kill_chain_phases: [{ kill_chain_name: 'mitre-attack', phase_name: 'persistence' }],
      x_mitre_is_subtechnique: false,
      x_mitre_platforms: ['Windows'],
    },
  };
}

describe('Release Tracks API', function () {
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

  async function createTechnique(name, description) {
    const res = await request(app)
      .post('/api/techniques')
      .send(buildTechnique(name, description))
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(201)
      .expect('Content-Type', /json/);

    return res.body;
  }

  async function removeObjectUser(object) {
    await AttackObject.updateOne(
      { 'stix.id': object.stix.id, 'stix.modified': object.stix.modified },
      { $unset: { 'workspace.workflow.created_by_user_account': '' } },
    );
  }

  function expectObjectInfo(entry, object) {
    expect(entry).toMatchObject({
      attack_id: object.workspace.attack_id,
      name: object.stix.name,
      description: object.stix.description,
      modified_by_user: {
        username: 'anonymous',
        displayName: 'Anonymous User',
        name: 'Anonymous User',
      },
    });
  }

  it('GET /api/release-tracks includes summaries and workbench object details', async function () {
    const memberObject = await createTechnique('Member Technique', 'Member description');
    const candidateObject = await createTechnique('Candidate Technique', 'Candidate description');
    const stagedObject = await createTechnique('Staged Technique', 'Staged description');
    const quarantinedObject = await createTechnique(
      'Quarantined Technique',
      'Quarantined description',
    );
    await removeObjectUser(candidateObject);
    await removeObjectUser(stagedObject);

    const createRes = await request(app)
      .post('/api/release-tracks/new')
      .send({
        name: 'Enterprise Test',
        description: 'Release track summary test',
        type: 'standard',
      })
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(201)
      .expect('Content-Type', /json/);

    const trackId = createRes.body.id;

    await request(app)
      .post(`/api/release-tracks/${trackId}/contents`)
      .send({
        x_mitre_contents: [
          {
            obj_ref: memberObject.stix.id,
            obj_modified: memberObject.stix.modified,
          },
        ],
      })
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    await request(app)
      .post(`/api/release-tracks/${trackId}/candidates`)
      .send({
        object_refs: [
          {
            id: candidateObject.stix.id,
            modified: candidateObject.stix.modified,
          },
          {
            id: stagedObject.stix.id,
            modified: stagedObject.stix.modified,
          },
        ],
      })
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    const promoteRes = await request(app)
      .post(`/api/release-tracks/${trackId}/candidates/promote`)
      .send({
        object_refs: [stagedObject.stix.id],
      })
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    const promotedSnapshot = await snapshotService.getLatestSnapshot(trackId);
    await snapshotService.cloneSnapshot(trackId, promotedSnapshot, {
      quarantine: [
        {
          object_ref: quarantinedObject.stix.id,
          object_modified: quarantinedObject.stix.modified,
          source_track_id: trackId,
          source_track_name: 'Enterprise Test',
          conflict_reason: 'test conflict',
        },
      ],
    });

    const listRes = await request(app)
      .get('/api/release-tracks')
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    const track = listRes.body.data.find((entry) => entry.track_id === trackId);
    expect(track).toBeDefined();
    expect(track.summary).toEqual({
      members_count: 1,
      staged_count: 1,
      candidates_count: 1,
    });

    const latestRes = await request(app)
      .get(`/api/release-tracks/${trackId}/snapshots/latest`)
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    const member = latestRes.body.members.find(
      (entry) => entry.object_ref === memberObject.stix.id,
    );
    expectObjectInfo(member, memberObject);

    const candidate = latestRes.body.candidates.find(
      (entry) => entry.object_ref === candidateObject.stix.id,
    );
    expectObjectInfo(candidate, candidateObject);

    const staged = latestRes.body.staged.find((entry) => entry.object_ref === stagedObject.stix.id);
    expectObjectInfo(staged, stagedObject);

    const quarantined = latestRes.body.quarantine.find(
      (entry) => entry.object_ref === quarantinedObject.stix.id,
    );
    expectObjectInfo(quarantined, quarantinedObject);

    const historicalRes = await request(app)
      .get(`/api/release-tracks/${trackId}/snapshots/${promoteRes.body.modified}`)
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    const historicalMember = historicalRes.body.members.find(
      (entry) => entry.object_ref === memberObject.stix.id,
    );
    expectObjectInfo(historicalMember, memberObject);

    const historicalCandidate = historicalRes.body.candidates.find(
      (entry) => entry.object_ref === candidateObject.stix.id,
    );
    expectObjectInfo(historicalCandidate, candidateObject);

    const historicalStaged = historicalRes.body.staged.find(
      (entry) => entry.object_ref === stagedObject.stix.id,
    );
    expectObjectInfo(historicalStaged, stagedObject);

    await request(app)
      .get(`/api/release-tracks/${trackId}/snapshots/latest?format=snapshot`)
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(400);

    await request(app)
      .get(`/api/release-tracks/${trackId}/snapshots/latest?format=filesystemstore`)
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(501);

    await request(app)
      .get(
        `/api/release-tracks/${trackId}/snapshots/${promoteRes.body.modified}?format=filesystemstore`,
      )
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(501);
  });

  after(async function () {
    await database.closeConnection();
  });
});
