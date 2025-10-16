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
    name: 'detection-strategy-1',
    spec_version: '2.1',
    type: 'x-mitre-detection-strategy',
    external_references: [
      {
        source_name: 'mitre-attack',
        external_id: 'DET9999',
        url: 'https://attack.mitre.org/detection-strategies/DET9999',
      },
    ],
    object_marking_refs: ['marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168'],
    created_by_ref: 'identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5',
    x_mitre_version: '1.0',
    x_mitre_attack_spec_version: '3.3.0',
    x_mitre_domains: ['enterprise-attack'],
    x_mitre_analytic_refs: [
      'x-mitre-analytic--12345678-1234-1234-1234-123456789000',
      'x-mitre-analytic--12345678-1234-1234-1234-123456789012',
    ],
  },
};

describe('Detection Strategies API', function () {
  let app;
  let passportCookie;

  before(async function () {
    // Establish the database connection
    // Use an in-memory database that we spin up for the test
    await database.initializeConnection();

    // Check for a valid database configuration
    await databaseConfiguration.checkSystemConfiguration();

    // Disable ADM validation for tests
    config.validateRequests.withAttackDataModel = false;
    config.validateRequests.withOpenApi = true;

    // Initialize the express app
    app = await require('../../../index').initializeApp();

    // Log into the app
    passportCookie = await login.loginAnonymous(app);
  });

  it('GET /api/detection-strategies returns an empty array of detection strategies', async function () {
    const res = await request(app)
      .get('/api/detection-strategies')
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    // We expect to get an empty array
    const detectionStrategies = res.body;
    expect(detectionStrategies).toBeDefined();
    expect(Array.isArray(detectionStrategies)).toBe(true);
    expect(detectionStrategies.length).toBe(0);
  });

  it('POST /api/detection-strategies does not create an empty detection strategy', async function () {
    const body = {};
    await request(app)
      .post('/api/detection-strategies')
      .send(body)
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(400);
  });

  let detectionStrategy1;
  it('POST /api/detection-strategies creates a detection strategy', async function () {
    const timestamp = new Date().toISOString();
    initialObjectData.stix.created = timestamp;
    initialObjectData.stix.modified = timestamp;
    const body = initialObjectData;
    const res = await request(app)
      .post('/api/detection-strategies')
      .send(body)
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(201)
      .expect('Content-Type', /json/);

    // We expect to get the created detection strategy
    detectionStrategy1 = res.body;
    expect(detectionStrategy1).toBeDefined();
    expect(detectionStrategy1.stix).toBeDefined();
    expect(detectionStrategy1.stix.id).toBeDefined();
    expect(detectionStrategy1.stix.created).toBeDefined();
    expect(detectionStrategy1.stix.modified).toBeDefined();
    expect(detectionStrategy1.stix.x_mitre_attack_spec_version).toBe(config.app.attackSpecVersion);
    expect(detectionStrategy1.stix.x_mitre_analytic_refs).toBeDefined();
    expect(Array.isArray(detectionStrategy1.stix.x_mitre_analytic_refs)).toBe(true);
    expect(detectionStrategy1.stix.x_mitre_analytic_refs.length).toBe(2);
  });

  it('GET /api/detection-strategies returns the added detection strategy', async function () {
    const res = await request(app)
      .get('/api/detection-strategies')
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    // We expect to get one detection strategy in an array
    const detectionStrategies = res.body;
    expect(detectionStrategies).toBeDefined();
    expect(Array.isArray(detectionStrategies)).toBe(true);
    expect(detectionStrategies.length).toBe(1);
  });

  it('GET /api/detection-strategies/:id should not return a detection strategy when the id cannot be found', async function () {
    await request(app)
      .get('/api/detection-strategies/not-an-id')
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(404);
  });

  it('GET /api/detection-strategies/:id returns the added detection strategy', async function () {
    const res = await request(app)
      .get('/api/detection-strategies/' + detectionStrategy1.stix.id)
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    // We expect to get one detection strategy in an array
    const detectionStrategies = res.body;
    expect(detectionStrategies).toBeDefined();
    expect(Array.isArray(detectionStrategies)).toBe(true);
    expect(detectionStrategies.length).toBe(1);

    const detectionStrategy = detectionStrategies[0];
    expect(detectionStrategy).toBeDefined();
    expect(detectionStrategy.stix).toBeDefined();
    expect(detectionStrategy.stix.id).toBe(detectionStrategy1.stix.id);
    expect(detectionStrategy.stix.type).toBe(detectionStrategy1.stix.type);
    expect(detectionStrategy.stix.name).toBe(detectionStrategy1.stix.name);
    expect(detectionStrategy.stix.spec_version).toBe(detectionStrategy1.stix.spec_version);
    expect(detectionStrategy.stix.object_marking_refs).toEqual(
      expect.arrayContaining(detectionStrategy1.stix.object_marking_refs),
    );

    expect(detectionStrategy.stix.created_by_ref).toBe(detectionStrategy1.stix.created_by_ref);
    expect(detectionStrategy.stix.x_mitre_version).toBe(detectionStrategy1.stix.x_mitre_version);
    expect(detectionStrategy.stix.x_mitre_attack_spec_version).toBe(
      detectionStrategy1.stix.x_mitre_attack_spec_version,
    );

    expect(detectionStrategy.stix.x_mitre_analytic_refs).toBeDefined();
    expect(Array.isArray(detectionStrategy.stix.x_mitre_analytic_refs)).toBe(true);
    expect(detectionStrategy.stix.x_mitre_analytic_refs.length).toBe(
      detectionStrategy1.stix.x_mitre_analytic_refs.length,
    );
  });

  it('PUT /api/detection-strategies updates a detection strategy', async function () {
    const originalModified = detectionStrategy1.stix.modified;
    const timestamp = new Date().toISOString();
    detectionStrategy1.stix.modified = timestamp;
    detectionStrategy1.stix.name = 'This is an updated detection strategy.';
    const body = detectionStrategy1;
    const res = await request(app)
      .put(
        '/api/detection-strategies/' + detectionStrategy1.stix.id + '/modified/' + originalModified,
      )
      .send(body)
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    // We expect to get the updated detection strategy
    const detectionStrategy = res.body;
    expect(detectionStrategy).toBeDefined();
    expect(detectionStrategy.stix.id).toBe(detectionStrategy1.stix.id);
    expect(detectionStrategy.stix.modified).toBe(detectionStrategy1.stix.modified);
  });

  it('POST /api/detection-strategies does not create a detection strategy with the same id and modified date', async function () {
    const body = detectionStrategy1;
    await request(app)
      .post('/api/detection-strategies')
      .send(body)
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(409);
  });

  let detectionStrategy2;
  it('POST /api/detection-strategies should create a new version of a detection strategy with a duplicate stix.id but different stix.modified date', async function () {
    detectionStrategy2 = _.cloneDeep(detectionStrategy1);
    detectionStrategy2._id = undefined;
    detectionStrategy2.__t = undefined;
    detectionStrategy2.__v = undefined;
    const timestamp = new Date().toISOString();
    detectionStrategy2.stix.modified = timestamp;
    const body = detectionStrategy2;
    const res = await request(app)
      .post('/api/detection-strategies')
      .send(body)
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(201)
      .expect('Content-Type', /json/);

    // We expect to get the created detection strategy
    const detectionStrategy = res.body;
    expect(detectionStrategy).toBeDefined();
  });

  let detectionStrategy3;
  it('POST /api/detection-strategies should create a new version of a detection strategy with a duplicate stix.id but different stix.modified date', async function () {
    detectionStrategy3 = _.cloneDeep(detectionStrategy1);
    detectionStrategy3._id = undefined;
    detectionStrategy3.__t = undefined;
    detectionStrategy3.__v = undefined;
    const timestamp = new Date().toISOString();
    detectionStrategy3.stix.modified = timestamp;
    const body = detectionStrategy3;
    const res = await request(app)
      .post('/api/detection-strategies')
      .send(body)
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(201)
      .expect('Content-Type', /json/);

    // We expect to get the created detection strategy
    const detectionStrategy = res.body;
    expect(detectionStrategy).toBeDefined();
  });

  it('GET /api/detection-strategies returns the latest added detection strategy', async function () {
    const res = await request(app)
      .get('/api/detection-strategies/' + detectionStrategy3.stix.id)
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    // We expect to get one detection strategy in an array
    const detectionStrategies = res.body;
    expect(detectionStrategies).toBeDefined();
    expect(Array.isArray(detectionStrategies)).toBe(true);
    expect(detectionStrategies.length).toBe(1);
    const detectionStrategy = detectionStrategies[0];
    expect(detectionStrategy.stix.id).toBe(detectionStrategy3.stix.id);
    expect(detectionStrategy.stix.modified).toBe(detectionStrategy3.stix.modified);
  });

  it('GET /api/detection-strategies returns all added detection strategies', async function () {
    const res = await request(app)
      .get('/api/detection-strategies/' + detectionStrategy1.stix.id + '?versions=all')
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    // We expect to get two detection strategies in an array
    const detectionStrategies = res.body;
    expect(detectionStrategies).toBeDefined();
    expect(Array.isArray(detectionStrategies)).toBe(true);
    expect(detectionStrategies.length).toBe(3);
  });

  it('GET /api/detection-strategies/:id/modified/:modified returns the first added detection strategy', async function () {
    const res = await request(app)
      .get(
        '/api/detection-strategies/' +
          detectionStrategy1.stix.id +
          '/modified/' +
          detectionStrategy1.stix.modified,
      )
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    // We expect to get one detection strategy in an array
    const detectionStrategy = res.body;
    expect(detectionStrategy).toBeDefined();
    expect(detectionStrategy.stix).toBeDefined();
    expect(detectionStrategy.stix.id).toBe(detectionStrategy1.stix.id);
    expect(detectionStrategy.stix.modified).toBe(detectionStrategy1.stix.modified);
  });

  it('GET /api/detection-strategies/:id/modified/:modified returns the second added detection strategy', async function () {
    const res = await request(app)
      .get(
        '/api/detection-strategies/' +
          detectionStrategy2.stix.id +
          '/modified/' +
          detectionStrategy2.stix.modified,
      )
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    // We expect to get one detection strategy in an array
    const detectionStrategy = res.body;
    expect(detectionStrategy).toBeDefined();
    expect(detectionStrategy.stix).toBeDefined();
    expect(detectionStrategy.stix.id).toBe(detectionStrategy2.stix.id);
    expect(detectionStrategy.stix.modified).toBe(detectionStrategy2.stix.modified);
  });

  it('DELETE /api/detection-strategies/:id should not delete a detection strategy when the id cannot be found', async function () {
    await request(app)
      .delete('/api/detection-strategies/not-an-id')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(404);
  });

  it('DELETE /api/detection-strategies/:id/modified/:modified deletes a detection strategy', async function () {
    await request(app)
      .delete(
        '/api/detection-strategies/' +
          detectionStrategy1.stix.id +
          '/modified/' +
          detectionStrategy1.stix.modified,
      )
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(204);
  });

  it('DELETE /api/detection-strategies/:id should delete all the detection strategies with the same stix id', async function () {
    await request(app)
      .delete('/api/detection-strategies/' + detectionStrategy2.stix.id)
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(204);
  });

  it('GET /api/detection-strategies returns an empty array of detection strategies', async function () {
    const res = await request(app)
      .get('/api/detection-strategies')
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    // We expect to get an empty array
    const detectionStrategies = res.body;
    expect(detectionStrategies).toBeDefined();
    expect(Array.isArray(detectionStrategies)).toBe(true);
    expect(detectionStrategies.length).toBe(0);
  });

  after(async function () {
    await database.closeConnection();
  });
});
