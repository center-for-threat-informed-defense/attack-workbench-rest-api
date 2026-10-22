const request = require('supertest');
const { expect } = require('expect');
const uuid = require('uuid');

const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');
const login = require('../../shared/login');
const config = require('../../../config/config');
const { cloneForCreate } = require('../../shared/clone-for-create');
const tacticsService = require('../../../services/stix/tactics-service');

const logger = require('../../../lib/logger');
logger.level = 'debug';

const initialTacticData = {
  workspace: {
    workflow: {
      state: 'work-in-progress',
    },
  },
  stix: {
    name: 'x-mitre-tactic-1',
    spec_version: '2.1',
    type: 'x-mitre-tactic',
    description: 'This is a tactic. yellow.',
    external_references: [{ source_name: 'mitre-attack', external_id: 'TA9001' }],
    object_marking_refs: ['marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168'],
  },
};

const newIdentityData = {
  workspace: {
    workflow: {
      state: 'work-in-progress',
    },
  },
  stix: {
    name: 'identity-1',
    identity_class: 'organization',
    spec_version: '2.1',
    type: 'identity',
    description: 'This is an identity.',
    object_marking_refs: ['marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168'],
  },
};

describe('Create Object with Organization Identity API', function () {
  let app;
  let passportCookie;

  before(async function () {
    // Establish the database connection
    // Use an in-memory database that we spin up for the test
    await database.initializeConnection();

    // Check for a valid database configuration
    await databaseConfiguration.checkSystemConfiguration();

    // Enable ADM validation; the request payloads in this spec are ADM-compliant
    config.validateRequests.withAttackDataModel = true;
    config.validateRequests.withOpenApi = true;

    // Initialize the express app
    app = await require('../../../index').initializeApp();

    // Log into the app
    passportCookie = await login.loginAnonymous(app);
  });

  let placeholderIdentity;
  it('GET /api/config/organization-identity returns the organizaton identity', async function () {
    const res = await request(app)
      .get('/api/config/organization-identity')
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    // We expect to get the organization identity
    placeholderIdentity = res.body;
    expect(placeholderIdentity).toBeDefined();
  });

  let tactic1;
  it('POST /api/tactics creates a tactic', async function () {
    initialTacticData.stix.id = `x-mitre-tactic--${uuid.v4()}`;
    const timestamp = new Date().toISOString();
    initialTacticData.stix.created = timestamp;
    initialTacticData.stix.modified = timestamp;
    const body = initialTacticData;
    const res = await request(app)
      .post('/api/tactics')
      .send(body)
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(201)
      .expect('Content-Type', /json/);

    // We expect to get the created tactic
    tactic1 = res.body;
    expect(tactic1).toBeDefined();
    expect(tactic1.stix).toBeDefined();
    expect(tactic1.stix.id).toBeDefined();
    expect(tactic1.stix.created).toBeDefined();
    expect(tactic1.stix.modified).toBeDefined();
    expect(tactic1.stix.created_by_ref).toBeDefined();
    expect(tactic1.stix.x_mitre_modified_by_ref).toBeDefined();
    expect(tactic1.stix.created_by_ref).toBe(placeholderIdentity.stix.id);
    expect(tactic1.stix.x_mitre_modified_by_ref).toBe(placeholderIdentity.stix.id);
  });

  let newIdentity;
  it('POST /api/identities creates an identity', async function () {
    const timestamp = new Date().toISOString();
    newIdentityData.stix.created = timestamp;
    newIdentityData.stix.modified = timestamp;
    const body = newIdentityData;
    const res = await request(app)
      .post('/api/identities')
      .send(body)
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(201)
      .expect('Content-Type', /json/);

    // We expect to get the created identity
    newIdentity = res.body;
    expect(newIdentity).toBeDefined();
    expect(newIdentity.stix).toBeDefined();
    expect(newIdentity.stix.id).toBeDefined();
    expect(newIdentity.stix.created).toBeDefined();
    expect(newIdentity.stix.modified).toBeDefined();
    expect(newIdentity.stix.created_by_ref).toBeUndefined();
    expect(newIdentity.stix.x_mitre_modified_by_ref).toBeUndefined();
  });

  it('POST /api/config/organization-identity sets the organization identity', async function () {
    const body = {
      id: newIdentity.stix.id,
    };
    // We expect the response body to be empty
    await request(app)
      .post('/api/config/organization-identity')
      .send(body)
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(204);
  });

  it('POST /api/tactics preserves creation provenance after the organization identity changes', async function () {
    // Alpha's explicit organization-identity workflow creates a newer revision.
    // Authoring must preserve that stored provenance, even from a stale payload.
    const latest = await request(app)
      .get(`/api/tactics/${tactic1.stix.id}`)
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(200);
    expect(latest.body[0].stix.created_by_ref).toBe(newIdentity.stix.id);
    const tactic2 = cloneForCreate(tactic1);
    const timestamp = new Date().toISOString();
    tactic2.stix.modified = timestamp;
    tactic2.stix.created = timestamp;
    tactic2.stix.created_by_ref = placeholderIdentity.stix.id;
    const body = tactic2;
    const res = await request(app)
      .post('/api/tactics')
      .send(body)
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(201)
      .expect('Content-Type', /json/);

    // We expect to get the created tactic
    const tactic = res.body;
    expect(tactic).toBeDefined();
    expect(tactic.stix).toBeDefined();
    expect(tactic.stix.id).toBeDefined();
    expect(tactic.stix.created).toBe(latest.body[0].stix.created);
    expect(tactic.stix.modified).toBeDefined();
    expect(tactic.stix.created_by_ref).toBeDefined();
    expect(tactic.stix.x_mitre_modified_by_ref).toBeDefined();
    expect(tactic.stix.created_by_ref).toBe(latest.body[0].stix.created_by_ref);
    expect(tactic.stix.x_mitre_modified_by_ref).toBe(newIdentity.stix.id); // Should match the new identity
    const original = await request(app)
      .get(`/api/tactics/${tactic1.stix.id}/modified/${tactic1.stix.modified}`)
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(200);
    expect(original.body.stix).toEqual(tactic1.stix);
  });

  it('POST leaves an omitted creator absent and initializes only an explicit creator', async function () {
    const imported = {
      workspace: { workflow: { state: 'work-in-progress' } },
      stix: structuredClone(tactic1.stix),
    };
    imported.stix.id = `x-mitre-tactic--${uuid.v4()}`;
    imported.stix.created = '2019-01-01T00:00:00.000Z';
    imported.stix.modified = '2020-01-01T00:00:00.000Z';
    delete imported.stix.created_by_ref;
    await tacticsService.create(structuredClone(imported), {
      import: true,
      validateContents: true,
    });

    const revision = cloneForCreate(imported);
    revision.stix.modified = '2021-01-01T00:00:00.000Z';
    revision.stix.created = revision.stix.modified;
    const saved = await request(app)
      .post('/api/tactics')
      .send(revision)
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(201);
    expect(saved.body.stix.created).toBe(imported.stix.created);
    expect(saved.body.stix).not.toHaveProperty('created_by_ref');
    expect(saved.body.stix.x_mitre_modified_by_ref).toBe(newIdentity.stix.id);
    const historical = await request(app)
      .get(`/api/tactics/${imported.stix.id}/modified/${imported.stix.modified}`)
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(200);
    expect(historical.body.stix).toEqual(imported.stix);

    const explicitRevision = cloneForCreate(saved.body);
    explicitRevision.stix.modified = '2022-01-01T00:00:00.000Z';
    explicitRevision.stix.created = explicitRevision.stix.modified;
    explicitRevision.stix.created_by_ref = placeholderIdentity.stix.id;
    const initialized = await request(app)
      .post('/api/tactics')
      .send(explicitRevision)
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(201);
    expect(initialized.body.stix.created).toBe(imported.stix.created);
    expect(initialized.body.stix.created_by_ref).toBe(placeholderIdentity.stix.id);
    expect(initialized.body.stix.x_mitre_modified_by_ref).toBe(newIdentity.stix.id);
    const previous = await request(app)
      .get(`/api/tactics/${saved.body.stix.id}/modified/${saved.body.stix.modified}`)
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(200);
    expect(previous.body.stix).toEqual(saved.body.stix);
  });

  it('POST rejects an invalid explicit creator when the latest creator is absent', async function () {
    const imported = {
      workspace: { workflow: { state: 'work-in-progress' } },
      stix: structuredClone(tactic1.stix),
    };
    imported.stix.id = `x-mitre-tactic--${uuid.v4()}`;
    imported.stix.created = '2019-01-01T00:00:00.000Z';
    imported.stix.modified = '2020-01-01T00:00:00.000Z';
    delete imported.stix.created_by_ref;
    await tacticsService.create(structuredClone(imported), {
      import: true,
      validateContents: true,
    });

    const revision = cloneForCreate(imported);
    revision.stix.modified = '2021-01-01T00:00:00.000Z';
    revision.stix.created_by_ref = 'not-an-identity-reference';
    const rejected = await request(app)
      .post('/api/tactics')
      .send(revision)
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(400);
    expect(rejected.body.message).toBe('ADM validation failed');
    expect(rejected.body.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: ['created_by_ref'] })]),
    );
    const history = await request(app)
      .get(`/api/tactics/${imported.stix.id}?versions=all`)
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(200);
    expect(history.body).toHaveLength(1);
    expect(history.body[0].stix).toEqual(imported.stix);
  });

  it('POST identity revisions still opt out of organization attribution', async function () {
    const revision = cloneForCreate(newIdentity);
    revision.stix.modified = new Date(Date.parse(newIdentity.stix.modified) + 1000).toISOString();
    const saved = await request(app)
      .post('/api/identities')
      .send(revision)
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(201);
    expect(saved.body.stix.created_by_ref).toBeUndefined();
    expect(saved.body.stix.x_mitre_modified_by_ref).toBeUndefined();
  });

  it('POST /api/tactics stamps brand-new objects with the active organization identity', async function () {
    const body = cloneForCreate(tactic1);
    delete body.stix.id;
    const res = await request(app)
      .post('/api/tactics')
      .send(body)
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(201);

    expect(res.body.stix.id).not.toBe(tactic1.stix.id);
    expect(res.body.stix.created_by_ref).toBe(newIdentity.stix.id);
    expect(res.body.stix.x_mitre_modified_by_ref).toBe(newIdentity.stix.id);
  });

  after(async function () {
    await database.closeConnection();
  });
});
