'use strict';

const request = require('supertest');
const { expect } = require('expect');

const config = require('../../../config/config');
const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');
const login = require('../../shared/login');
const Technique = require('../../../models/technique-model');

const markingDefinitionId = 'marking-definition--613f2e26-407d-48c7-9eca-b8e91df99dc9';

function technique(name, domains) {
  const timestamp = new Date().toISOString();
  const killChains = {
    'enterprise-attack': 'mitre-attack',
    'mobile-attack': 'mitre-mobile-attack',
    'ics-attack': 'mitre-ics-attack',
  };
  return {
    workspace: { workflow: { state: 'work-in-progress' } },
    stix: {
      created: timestamp,
      modified: timestamp,
      name,
      description: `${name} description`,
      spec_version: '2.1',
      type: 'attack-pattern',
      object_marking_refs: [markingDefinitionId],
      kill_chain_phases: domains.map((domain) => ({
        kill_chain_name: killChains[domain],
        phase_name: 'persistence',
      })),
      x_mitre_is_subtechnique: false,
      x_mitre_platforms: ['Windows'],
      x_mitre_domains: domains,
      x_mitre_version: '1.0',
    },
  };
}

function relationship(source, target, extra = {}) {
  const timestamp = new Date().toISOString();
  return {
    workspace: { workflow: { state: 'work-in-progress' } },
    stix: {
      created: timestamp,
      modified: timestamp,
      spec_version: '2.1',
      type: 'relationship',
      relationship_type: 'subtechnique-of',
      source_ref: source.stix.id,
      target_ref: target.stix.id,
      object_marking_refs: [markingDefinitionId],
      ...extra,
    },
  };
}

const Relationship = require('../../../models/relationship-model');
const repository = require('../../../repository/relationships-repository');
const { randomUUID } = require('node:crypto');

describe('GET /api/reports/parallel-relationships', function () {
  let app;
  let passportCookie;
  let source;
  let target;

  before(async function () {
    await database.initializeConnection();
    await databaseConfiguration.checkSystemConfiguration();
    config.validateRequests.withAttackDataModel = true;
    config.validateRequests.withOpenApi = true;
    app = await require('../../../index').initializeApp();
    passportCookie = await login.loginAnonymous(app);
  });

  after(async function () {
    await database.closeConnection();
  });

  function authenticated(builder) {
    return builder.set('Cookie', `${passportCookie.name}=${passportCookie.value}`);
  }

  async function post(path, body) {
    return (await authenticated(request(app).post(path).send(body)).expect(201)).body;
  }

  async function report() {
    return (
      await authenticated(request(app).get('/api/reports/parallel-relationships')).expect(200)
    ).body;
  }

  beforeEach(async function () {
    await Relationship.deleteMany({});
    await Technique.deleteMany({});
    source = await post('/api/techniques', technique('Source', ['enterprise-attack']));
    target = await post('/api/techniques', technique('Target', ['enterprise-attack']));
  });

  async function revision(model, id, changes) {
    const document = await model.findOne({ 'stix.id': id }).sort({ 'stix.modified': -1 }).lean();
    delete document._id;
    Object.assign(document.stix, changes, {
      modified: new Date(new Date(document.stix.modified).getTime() + 1000),
    });
    return model.create(document);
  }

  it('filters singletons before returning data and bounds endpoint history to one revision', async function () {
    const first = await post('/api/relationships', relationship(source, target));
    const second = await post('/api/relationships', relationship(source, target));
    await revision(Relationship, first.stix.id, { description: 'Newest relationship' });

    // Simulate imported historical content using schema-backed copies of API-valid fixtures.
    const template = await Technique.findOne({ 'stix.id': source.stix.id }).lean();
    delete template._id;
    const history = Array.from({ length: 40 }, (_, index) => ({
      ...template,
      stix: {
        ...template.stix,
        modified: new Date(new Date(template.stix.modified).getTime() + (index + 1) * 1000),
        description: 'x'.repeat(8192),
        name: `Source revision ${index + 1}`,
      },
    }));
    await Technique.insertMany(history);
    const singleton = await Relationship.findOne({ 'stix.id': second.stix.id }).lean();
    delete singleton._id;
    await Relationship.insertMany(
      Array.from({ length: 100 }, () => ({
        ...singleton,
        stix: {
          ...singleton.stix,
          id: `relationship--${randomUUID()}`,
          target_ref: `attack-pattern--${randomUUID()}`,
        },
      })),
    );

    const oldResults = await repository.retrieveAll({ versions: 'latest', lookupRefs: true });
    const groups = await repository.retrieveParallelRelationships();
    const results = [...groups.values()].flat();
    expect(results).toHaveLength(2);
    for (const result of results) {
      expect(result.source_objects).toHaveLength(1);
      expect(result.source_objects[0].stix.name).toBe('Source revision 40');
      expect(result.target_objects).toHaveLength(1);
    }
    const oldBytes = Buffer.byteLength(JSON.stringify(oldResults));
    const newBytes = Buffer.byteLength(JSON.stringify(results));
    expect(newBytes).toBeLessThan(oldBytes / 100);
    console.log(
      `Parallel report fixture: old query ${oldBytes} bytes; new query ${newBytes} bytes`,
    );

    const response = await report();
    const key = `${source.stix.id}--subtechnique-of--${target.stix.id}`;
    expect(Object.keys(response)).toEqual([key]);
    expect(response[key].map((item) => item.stix.id).sort()).toEqual(
      [first.stix.id, second.stix.id].sort(),
    );
    expect(response[key].find((item) => item.stix.id === first.stix.id).stix.description).toBe(
      'Newest relationship',
    );
    for (const result of response[key]) {
      expect(result.source_object.stix.name).toBe('Source revision 40');
      expect(result.target_object.stix.id).toBe(target.stix.id);
      expect(result.source_objects).toBeUndefined();
      expect(result.target_objects).toBeUndefined();
    }
  });

  it('does not resurrect old active revisions or count history as duplicates', async function () {
    const first = await post('/api/relationships', relationship(source, target));
    const revoked = await post('/api/relationships', relationship(source, target));
    const deprecated = await post('/api/relationships', relationship(source, target));
    await revision(Relationship, first.stix.id, { description: 'Latest' });
    await revision(Relationship, revoked.stix.id, { revoked: true });
    await revision(Relationship, deprecated.stix.id, { x_mitre_deprecated: true });
    expect(await report()).toEqual({});
  });

  it('keeps duplicate findings when endpoints are missing', async function () {
    await post('/api/relationships', relationship(source, target));
    await post('/api/relationships', relationship(source, target));
    await Technique.deleteMany({});
    const response = await report();
    const results = Object.values(response).flat();
    expect(results).toHaveLength(2);
    for (const result of results) {
      expect(result.source_object).toBeUndefined();
      expect(result.target_object).toBeUndefined();
    }
  });
});
