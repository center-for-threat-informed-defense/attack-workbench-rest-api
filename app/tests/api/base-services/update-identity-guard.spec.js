const request = require('supertest');
const { expect } = require('expect');

const config = require('../../../config/config');
const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');
const login = require('../../shared/login');

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
      x_mitre_platforms: ['Windows'],
    },
  };
}

// Revision identity (stix.id + stix.modified) is immutable in place: a PUT
// whose body identity fields differ from the path parameters must be
// rejected. Release tracks pin revisions by (stix.id, stix.modified) —
// re-keying a document in place would strand those pins. Re-keying goes
// through POST (a new revision) instead.
describe('PUT revision identity guard', function () {
  let app;
  let passportCookie;
  let technique;

  before(async function () {
    await database.initializeConnection();
    await databaseConfiguration.checkSystemConfiguration();

    config.validateRequests.withAttackDataModel = true;
    config.validateRequests.withOpenApi = true;

    app = await require('../../../index').initializeApp();
    passportCookie = await login.loginAnonymous(app);

    const res = await request(app)
      .post('/api/techniques')
      .send(buildTechnique('Identity Guard'))
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(201);
    technique = res.body;
  });

  function putTechnique(body) {
    return request(app)
      .put(`/api/techniques/${technique.stix.id}/modified/${technique.stix.modified}`)
      .send(body)
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`);
  }

  it('rejects a PUT whose body stix.modified differs from the path parameter', async function () {
    const update = buildTechnique('Identity Guard (re-keyed modified)');
    update.stix.id = technique.stix.id;
    update.stix.created = technique.stix.created;
    update.stix.modified = new Date(
      new Date(technique.stix.modified).getTime() + 1000,
    ).toISOString();

    await putTechnique(update).expect(400);
  });

  it('rejects a PUT whose body stix.id differs from the path parameter', async function () {
    const update = buildTechnique('Identity Guard (re-keyed id)');
    update.stix.id = 'attack-pattern--00000000-0000-4000-8000-000000000000';
    update.stix.created = technique.stix.created;
    update.stix.modified = technique.stix.modified;

    await putTechnique(update).expect(400);
  });

  it('did not alter the stored revision on the rejected PUTs', async function () {
    const res = await request(app)
      .get(`/api/techniques/${technique.stix.id}/modified/${technique.stix.modified}`)
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(200);

    expect(res.body.stix.name).toBe('Identity Guard');
    expect(res.body.stix.modified).toBe(technique.stix.modified);
  });

  it('accepts a PUT whose body identity matches the path parameters', async function () {
    const update = buildTechnique('Identity Guard (updated)');
    update.stix.id = technique.stix.id;
    update.stix.created = technique.stix.created;
    update.stix.modified = technique.stix.modified;

    const res = await putTechnique(update).expect(200);
    expect(res.body.stix.name).toBe('Identity Guard (updated)');
    expect(res.body.stix.modified).toBe(technique.stix.modified);
  });

  after(async function () {
    await database.closeConnection();
  });
});
