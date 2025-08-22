const request = require('supertest');
const { expect } = require('expect');
const _ = require('lodash');

const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');

const config = require('../../../config/config');
const login = require('../../shared/login');

const logger = require('../../../lib/logger');
logger.level = 'debug';

// modified and created properties will be set before calling REST API
// stix.id property will be created by REST API
const initialObjectData = {
  workspace: {
    workflow: {
      state: 'work-in-progress',
    },
  },
  stix: {
    name: 'log-source-1',
    spec_version: '2.1',
    type: 'x-mitre-log-source',
    external_references: [
      {
        source_name: 'mitre-attack',
        external_id: 'LS9999',
        url: 'https://attack.mitre.org/log-sources/LS9999',
      },
    ],
    object_marking_refs: ['marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168'],
    created_by_ref: 'identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5',
    x_mitre_version: '1.0',
    x_mitre_attack_spec_version: '3.3.0',
    x_mitre_log_source_permutations: [
      {
        name: 'perm-1',
        channel: 'channel-1',
        data_component_name: 'component-1',
      },
      {
        name: 'perm-2',
        channel: 'channel-2',
        data_component_name: 'component-2',
      },
    ],
  },
};

describe('Log Sources API', function () {
  let app;
  let passportCookie;

  before(async function () {
    // Establish the database connection
    // Use an in-memory database that we spin up for the test
    await database.initializeConnection();

    // Check for a valid database configuration
    await databaseConfiguration.checkSystemConfiguration();

    // Initialize the express app
    app = await require('../../../index').initializeApp();

    // Log into the app
    passportCookie = await login.loginAnonymous(app);
  });

  it('GET /api/log-sources returns an empty array of log sources', async function () {
    const res = await request(app)
      .get('/api/log-sources')
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    // We expect to get an empty array
    const logSources = res.body;
    expect(logSources).toBeDefined();
    expect(Array.isArray(logSources)).toBe(true);
    expect(logSources.length).toBe(0);
  });

  it('POST /api/log-sources does not create an empty log source', async function () {
    const body = {};
    await request(app)
      .post('/api/log-sources')
      .send(body)
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(400);
  });

  let logSource1;
  it('POST /api/log-sources creates a log source', async function () {
    const timestamp = new Date().toISOString();
    initialObjectData.stix.created = timestamp;
    initialObjectData.stix.modified = timestamp;
    const body = initialObjectData;
    const res = await request(app)
      .post('/api/log-sources')
      .send(body)
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(201)
      .expect('Content-Type', /json/);

    // We expect to get the created log source
    logSource1 = res.body;
    expect(logSource1).toBeDefined();
    expect(logSource1.stix).toBeDefined();
    expect(logSource1.stix.id).toBeDefined();
    expect(logSource1.stix.created).toBeDefined();
    expect(logSource1.stix.modified).toBeDefined();
    expect(logSource1.stix.x_mitre_attack_spec_version).toBe(config.app.attackSpecVersion);

    expect(logSource1.stix.x_mitre_log_source_permutations).toBeDefined();
    expect(Array.isArray(logSource1.stix.x_mitre_log_source_permutations)).toBe(true);
    expect(logSource1.stix.x_mitre_log_source_permutations.length).toBe(2);
  });

  it('GET /api/log-sources returns the added log source', async function () {
    const res = await request(app)
      .get('/api/log-sources')
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    // We expect to get one log source in an array
    const logSources = res.body;
    expect(logSources).toBeDefined();
    expect(Array.isArray(logSources)).toBe(true);
    expect(logSources.length).toBe(1);
  });

  it('GET /api/log-sources/:id/channels returns the permutation channels of the added log source', async function () {
    const res = await request(app)
      .get('/api/log-sources/' + logSource1.stix.id + '/channels')
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    // We expect to get two log source permutation channels in an array
    const logSourceChannels = res.body;
    expect(logSourceChannels).toBeDefined();
    expect(Array.isArray(logSourceChannels)).toBe(true);
    expect(logSourceChannels.length).toBe(2);
    expect(logSourceChannels[0]).toBe(
      initialObjectData.stix.x_mitre_log_source_permutations[0].channel,
    );
    expect(logSourceChannels[1]).toBe(
      initialObjectData.stix.x_mitre_log_source_permutations[1].channel,
    );
  });

  it('GET /api/log-sources/:id/permutations returns the permutations of the added log source', async function () {
    const res = await request(app)
      .get('/api/log-sources/' + logSource1.stix.id + '/permutations')
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    // We expect to get two log source permutations in an array
    const logSourcePermutations = res.body;
    expect(logSourcePermutations).toBeDefined();
    expect(Array.isArray(logSourcePermutations)).toBe(true);
    expect(logSourcePermutations.length).toBe(2);
    expect(logSourcePermutations[0].name).toBeDefined();
    expect(logSourcePermutations[0].channel).toBeDefined();
    expect(logSourcePermutations[1].name).toBeDefined();
    expect(logSourcePermutations[1].channel).toBeDefined();
  });

  it('GET /api/log-sources/:id should not return a log source when the id cannot be found', async function () {
    await request(app)
      .get('/api/log-sources/not-an-id')
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(404);
  });

  it('GET /api/log-sources/:id returns the added log source', async function () {
    const res = await request(app)
      .get('/api/log-sources/' + logSource1.stix.id)
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    // We expect to get one log source in an array
    const logSources = res.body;
    expect(logSources).toBeDefined();
    expect(Array.isArray(logSources)).toBe(true);
    expect(logSources.length).toBe(1);

    const logSource = logSources[0];
    expect(logSource).toBeDefined();
    expect(logSource.stix).toBeDefined();
    expect(logSource.stix.id).toBe(logSource1.stix.id);
    expect(logSource.stix.type).toBe(logSource1.stix.type);
    expect(logSource.stix.name).toBe(logSource1.stix.name);
    expect(logSource.stix.spec_version).toBe(logSource1.stix.spec_version);
    expect(logSource.stix.object_marking_refs).toEqual(
      expect.arrayContaining(logSource1.stix.object_marking_refs),
    );
    expect(logSource.stix.created_by_ref).toBe(logSource1.stix.created_by_ref);
    expect(logSource.stix.x_mitre_version).toBe(logSource1.stix.x_mitre_version);
    expect(logSource.stix.x_mitre_attack_spec_version).toBe(
      logSource1.stix.x_mitre_attack_spec_version,
    );

    expect(logSource.stix.x_mitre_log_source_permutations).toBeDefined();
    expect(Array.isArray(logSource.stix.x_mitre_log_source_permutations)).toBe(true);
    expect(logSource.stix.x_mitre_log_source_permutations.length).toBe(
      logSource1.stix.x_mitre_log_source_permutations.length,
    );
  });

  it('PUT /api/log-sources updates a log source', async function () {
    const originalModified = logSource1.stix.modified;
    const timestamp = new Date().toISOString();
    logSource1.stix.modified = timestamp;
    logSource1.stix.name = 'This is an updated log source.';
    const body = logSource1;
    const res = await request(app)
      .put('/api/log-sources/' + logSource1.stix.id + '/modified/' + originalModified)
      .send(body)
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    // We expect to get the updated log source
    const logSource = res.body;
    expect(logSource).toBeDefined();
    expect(logSource.stix.id).toBe(logSource1.stix.id);
    expect(logSource.stix.modified).toBe(logSource1.stix.modified);
  });

  it('POST /api/log-sources does not create a log source with the same id and modified date', async function () {
    const body = logSource1;
    await request(app)
      .post('/api/log-sources')
      .send(body)
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(409);
  });

  let logSource2;
  it('POST /api/log-sources should create a new version of a log source with a duplicate stix.id but different stix.modified date', async function () {
    logSource2 = _.cloneDeep(logSource1);
    logSource2._id = undefined;
    logSource2.__t = undefined;
    logSource2.__v = undefined;
    const timestamp = new Date().toISOString();
    logSource2.stix.modified = timestamp;
    const body = logSource2;
    const res = await request(app)
      .post('/api/log-sources')
      .send(body)
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(201)
      .expect('Content-Type', /json/);

    // We expect to get the created log source
    const logSource = res.body;
    expect(logSource).toBeDefined();
  });

  let logSource3;
  it('POST /api/log-sources should create a new version of a log source with a duplicate stix.id but different stix.modified date', async function () {
    logSource3 = _.cloneDeep(logSource1);
    logSource3._id = undefined;
    logSource3.__t = undefined;
    logSource3.__v = undefined;
    const timestamp = new Date().toISOString();
    logSource3.stix.modified = timestamp;
    const body = logSource3;
    const res = await request(app)
      .post('/api/log-sources')
      .send(body)
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(201)
      .expect('Content-Type', /json/);

    // We expect to get the created log source
    const logSource = res.body;
    expect(logSource).toBeDefined();
  });

  it('GET /api/log-sources returns the latest added log source', async function () {
    const res = await request(app)
      .get('/api/log-sources/' + logSource3.stix.id)
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    // We expect to get one log source in an array
    const logSources = res.body;
    expect(logSources).toBeDefined();
    expect(Array.isArray(logSources)).toBe(true);
    expect(logSources.length).toBe(1);
    const logSource = logSources[0];
    expect(logSource.stix.id).toBe(logSource3.stix.id);
    expect(logSource.stix.modified).toBe(logSource3.stix.modified);
  });

  it('GET /api/log-sources returns all added log sources', async function () {
    const res = await request(app)
      .get('/api/log-sources/' + logSource1.stix.id + '?versions=all')
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    // We expect to get two log sources in an array
    const logSources = res.body;
    expect(logSources).toBeDefined();
    expect(Array.isArray(logSources)).toBe(true);
    expect(logSources.length).toBe(3);
  });

  it('GET /api/log-sources/:id/modified/:modified returns the first added log source', async function () {
    const res = await request(app)
      .get('/api/log-sources/' + logSource1.stix.id + '/modified/' + logSource1.stix.modified)
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    // We expect to get one log source in an array
    const logSource = res.body;
    expect(logSource).toBeDefined();
    expect(logSource.stix).toBeDefined();
    expect(logSource.stix.id).toBe(logSource1.stix.id);
    expect(logSource.stix.modified).toBe(logSource1.stix.modified);
  });

  it('GET /api/log-sources/:id/modified/:modified returns the second added log source', async function () {
    const res = await request(app)
      .get('/api/log-sources/' + logSource2.stix.id + '/modified/' + logSource2.stix.modified)
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    // We expect to get one log source in an array
    const logSource = res.body;
    expect(logSource).toBeDefined();
    expect(logSource.stix).toBeDefined();
    expect(logSource.stix.id).toBe(logSource2.stix.id);
    expect(logSource.stix.modified).toBe(logSource2.stix.modified);
  });

  it('DELETE /api/log-sources/:id should not delete a log source when the id cannot be found', async function () {
    await request(app)
      .delete('/api/log-sources/not-an-id')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(404);
  });

  it('DELETE /api/log-sources/:id/modified/:modified deletes a log source', async function () {
    await request(app)
      .delete('/api/log-sources/' + logSource1.stix.id + '/modified/' + logSource1.stix.modified)
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(204);
  });

  it('DELETE /api/log-sources/:id should delete all the log sources with the same stix id', async function () {
    await request(app)
      .delete('/api/log-sources/' + logSource2.stix.id)
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(204);
  });

  it('GET /api/log-sources returns an empty array of log sources', async function () {
    const res = await request(app)
      .get('/api/log-sources')
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    // We expect to get an empty array
    const logSources = res.body;
    expect(logSources).toBeDefined();
    expect(Array.isArray(logSources)).toBe(true);
    expect(logSources.length).toBe(0);
  });

  after(async function () {
    await database.closeConnection();
  });
});
