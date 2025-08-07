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
    description: 'analytic-1',
    spec_version: '2.1',
    type: 'x-mitre-analytic',
    external_references: [
      {
        source_name: 'mitre-attack',
        external_id: 'AN9999',
        url: 'https://attack.mitre.org/analytics/AN9999',
      },
    ],
    object_marking_refs: ['marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168'],
    created_by_ref: 'identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5',
    x_mitre_version: '1.0',
    x_mitre_attack_spec_version: '3.3.0',
    x_mitre_platforms: ['windows'],
    x_mitre_log_sources: [
      {
        ref: 'log-source-1',
        keys: ['perm-1'],
      },
      {
        ref: 'log-source-2',
        keys: ['perm-2'],
      },
    ],
    x_mitre_mutable_elements: [
      {
        field: 'fieldOne',
        description: 'Description of fieldOne',
      },
      {
        field: 'fieldTwo',
        description: 'Description of fieldTwo',
      },
    ],
  },
};

describe('Analytics API', function () {
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

  it('GET /api/analytics returns an empty array of analytics', async function () {
    const res = await request(app)
      .get('/api/analytics')
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    // We expect to get an empty array
    const analytics = res.body;
    expect(analytics).toBeDefined();
    expect(Array.isArray(analytics)).toBe(true);
    expect(analytics.length).toBe(0);
  });

  it('POST /api/analytics does not create an empty analytic', async function () {
    const body = {};
    await request(app)
      .post('/api/analytics')
      .send(body)
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(400);
  });

  let analytic1;
  it('POST /api/analytics creates a analytic', async function () {
    const timestamp = new Date().toISOString();
    initialObjectData.stix.created = timestamp;
    initialObjectData.stix.modified = timestamp;
    const body = initialObjectData;
    const res = await request(app)
      .post('/api/analytics')
      .send(body)
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(201)
      .expect('Content-Type', /json/);

    // We expect to get the created analytic
    analytic1 = res.body;
    expect(analytic1).toBeDefined();
    expect(analytic1.stix).toBeDefined();
    expect(analytic1.stix.id).toBeDefined();
    expect(analytic1.stix.created).toBeDefined();
    expect(analytic1.stix.modified).toBeDefined();
    expect(analytic1.stix.x_mitre_attack_spec_version).toBe(config.app.attackSpecVersion);

    expect(analytic1.stix.x_mitre_log_sources).toBeDefined();
    expect(Array.isArray(analytic1.stix.x_mitre_log_sources)).toBe(true);
    expect(analytic1.stix.x_mitre_log_sources.length).toBe(2);
    expect(analytic1.stix.x_mitre_mutable_elements).toBeDefined();
    expect(Array.isArray(analytic1.stix.x_mitre_mutable_elements)).toBe(true);
    expect(analytic1.stix.x_mitre_mutable_elements.length).toBe(2);
  });

  it('GET /api/analytics returns the added analytic', async function () {
    const res = await request(app)
      .get('/api/analytics')
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    // We expect to get one analytic in an array
    const analytics = res.body;
    expect(analytics).toBeDefined();
    expect(Array.isArray(analytics)).toBe(true);
    expect(analytics.length).toBe(1);
  });

  it('GET /api/analytics/:id should not return a analytic when the id cannot be found', async function () {
    await request(app)
      .get('/api/analytics/not-an-id')
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(404);
  });

  it('GET /api/analytics/:id returns the added analytic', async function () {
    const res = await request(app)
      .get('/api/analytics/' + analytic1.stix.id)
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    // We expect to get one analytic in an array
    const analytics = res.body;
    expect(analytics).toBeDefined();
    expect(Array.isArray(analytics)).toBe(true);
    expect(analytics.length).toBe(1);

    const analytic = analytics[0];
    expect(analytic).toBeDefined();
    expect(analytic.stix).toBeDefined();
    expect(analytic.stix.id).toBe(analytic1.stix.id);
    expect(analytic.stix.type).toBe(analytic1.stix.type);
    expect(analytic.stix.description).toBe(analytic1.stix.description);
    expect(analytic.stix.spec_version).toBe(analytic1.stix.spec_version);
    expect(analytic.stix.object_marking_refs).toEqual(
      expect.arrayContaining(analytic1.stix.object_marking_refs),
    );
    expect(analytic.stix.created_by_ref).toBe(analytic1.stix.created_by_ref);
    expect(analytic.stix.x_mitre_version).toBe(analytic1.stix.x_mitre_version);
    expect(analytic.stix.x_mitre_attack_spec_version).toBe(
      analytic1.stix.x_mitre_attack_spec_version,
    );

    expect(analytic.stix.x_mitre_log_sources).toBeDefined();
    expect(Array.isArray(analytic.stix.x_mitre_log_sources)).toBe(true);
    expect(analytic.stix.x_mitre_log_sources.length).toBe(
      analytic1.stix.x_mitre_log_sources.length,
    );
    expect(analytic.stix.x_mitre_mutable_elements).toBeDefined();
    expect(Array.isArray(analytic.stix.x_mitre_mutable_elements)).toBe(true);
    expect(analytic.stix.x_mitre_mutable_elements.length).toBe(
      analytic1.stix.x_mitre_mutable_elements.length,
    );
  });

  it('PUT /api/analytics updates a analytic', async function () {
    const originalModified = analytic1.stix.modified;
    const timestamp = new Date().toISOString();
    analytic1.stix.modified = timestamp;
    analytic1.stix.description = 'This is an updated analytic.';
    const body = analytic1;
    const res = await request(app)
      .put('/api/analytics/' + analytic1.stix.id + '/modified/' + originalModified)
      .send(body)
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    // We expect to get the updated analytic
    const analytic = res.body;
    expect(analytic).toBeDefined();
    expect(analytic.stix.id).toBe(analytic1.stix.id);
    expect(analytic.stix.modified).toBe(analytic1.stix.modified);
  });

  it('POST /api/analytics does not create a analytic with the same id and modified date', async function () {
    const body = analytic1;
    await request(app)
      .post('/api/analytics')
      .send(body)
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(409);
  });

  let analytic2;
  it('POST /api/analytics should create a new version of a analytic with a duplicate stix.id but different stix.modified date', async function () {
    analytic2 = _.cloneDeep(analytic1);
    analytic2._id = undefined;
    analytic2.__t = undefined;
    analytic2.__v = undefined;
    const timestamp = new Date().toISOString();
    analytic2.stix.modified = timestamp;
    const body = analytic2;
    const res = await request(app)
      .post('/api/analytics')
      .send(body)
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(201)
      .expect('Content-Type', /json/);

    // We expect to get the created analytic
    const analytic = res.body;
    expect(analytic).toBeDefined();
  });

  let analytic3;
  it('POST /api/analytics should create a new version of a analytic with a duplicate stix.id but different stix.modified date', async function () {
    analytic3 = _.cloneDeep(analytic1);
    analytic3._id = undefined;
    analytic3.__t = undefined;
    analytic3.__v = undefined;
    const timestamp = new Date().toISOString();
    analytic3.stix.modified = timestamp;
    const body = analytic3;
    const res = await request(app)
      .post('/api/analytics')
      .send(body)
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(201)
      .expect('Content-Type', /json/);

    // We expect to get the created analytic
    const analytic = res.body;
    expect(analytic).toBeDefined();
  });

  it('GET /api/analytics returns the latest added analytic', async function () {
    const res = await request(app)
      .get('/api/analytics/' + analytic3.stix.id)
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    // We expect to get one analytic in an array
    const analytics = res.body;
    expect(analytics).toBeDefined();
    expect(Array.isArray(analytics)).toBe(true);
    expect(analytics.length).toBe(1);
    const analytic = analytics[0];
    expect(analytic.stix.id).toBe(analytic3.stix.id);
    expect(analytic.stix.modified).toBe(analytic3.stix.modified);
  });

  it('GET /api/analytics returns all added analytics', async function () {
    const res = await request(app)
      .get('/api/analytics/' + analytic1.stix.id + '?versions=all')
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    // We expect to get two analytics in an array
    const analytics = res.body;
    expect(analytics).toBeDefined();
    expect(Array.isArray(analytics)).toBe(true);
    expect(analytics.length).toBe(3);
  });

  it('GET /api/analytics/:id/modified/:modified returns the first added analytic', async function () {
    const res = await request(app)
      .get('/api/analytics/' + analytic1.stix.id + '/modified/' + analytic1.stix.modified)
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    // We expect to get one analytic in an array
    const analytic = res.body;
    expect(analytic).toBeDefined();
    expect(analytic.stix).toBeDefined();
    expect(analytic.stix.id).toBe(analytic1.stix.id);
    expect(analytic.stix.modified).toBe(analytic1.stix.modified);
  });

  it('GET /api/analytics/:id/modified/:modified returns the second added analytic', async function () {
    const res = await request(app)
      .get('/api/analytics/' + analytic2.stix.id + '/modified/' + analytic2.stix.modified)
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    // We expect to get one analytic in an array
    const analytic = res.body;
    expect(analytic).toBeDefined();
    expect(analytic.stix).toBeDefined();
    expect(analytic.stix.id).toBe(analytic2.stix.id);
    expect(analytic.stix.modified).toBe(analytic2.stix.modified);
  });

  it('DELETE /api/analytics/:id should not delete a analytic when the id cannot be found', async function () {
    await request(app)
      .delete('/api/analytics/not-an-id')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(404);
  });

  it('DELETE /api/analytics/:id/modified/:modified deletes a analytic', async function () {
    await request(app)
      .delete('/api/analytics/' + analytic1.stix.id + '/modified/' + analytic1.stix.modified)
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(204);
  });

  it('DELETE /api/analytics/:id should delete all the analytics with the same stix id', async function () {
    await request(app)
      .delete('/api/analytics/' + analytic2.stix.id)
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(204);
  });

  it('GET /api/analytics returns an empty array of analytics', async function () {
    const res = await request(app)
      .get('/api/analytics')
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    // We expect to get an empty array
    const analytics = res.body;
    expect(analytics).toBeDefined();
    expect(Array.isArray(analytics)).toBe(true);
    expect(analytics.length).toBe(0);
  });

  after(async function () {
    await database.closeConnection();
  });
});
