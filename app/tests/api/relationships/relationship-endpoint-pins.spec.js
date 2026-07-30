'use strict';

const request = require('supertest');
const { expect } = require('expect');

const config = require('../../../config/config');
const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');
const login = require('../../shared/login');
const { cloneForCreate } = require('../../shared/clone-for-create');

const markingDefinitionId = 'marking-definition--613f2e26-407d-48c7-9eca-b8e91df99dc9';

describe('Relationship endpoint revision pins', function () {
  let app;
  let passportCookie;
  let source;
  let target;
  let relationship;

  before(async function () {
    await database.initializeConnection();
    await databaseConfiguration.checkSystemConfiguration();
    config.validateRequests.withAttackDataModel = true;
    config.validateRequests.withOpenApi = true;
    app = await require('../../../index').initializeApp();
    passportCookie = await login.loginAnonymous(app);
  });

  async function post(path, body, expectedStatus = 201) {
    const response = await request(app)
      .post(path)
      .send(body)
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(expectedStatus);
    return response.body;
  }

  before('create endpoint objects and their relationship', async function () {
    const sourceTimestamp = new Date().toISOString();
    source = await post('/api/software', {
      workspace: { workflow: { state: 'work-in-progress' } },
      stix: {
        type: 'malware',
        spec_version: '2.1',
        created: sourceTimestamp,
        modified: sourceTimestamp,
        name: 'Revision-pinned source',
        description: 'Source object for relationship revision pin tests.',
        is_family: false,
        x_mitre_domains: ['enterprise-attack'],
        x_mitre_platforms: ['Windows'],
        object_marking_refs: [markingDefinitionId],
      },
    });

    const targetTimestamp = new Date().toISOString();
    target = await post('/api/techniques', {
      workspace: { workflow: { state: 'work-in-progress' } },
      stix: {
        type: 'attack-pattern',
        spec_version: '2.1',
        created: targetTimestamp,
        modified: targetTimestamp,
        name: 'Revision-pinned target',
        description: 'Target object for relationship revision pin tests.',
        kill_chain_phases: [{ kill_chain_name: 'mitre-attack', phase_name: 'execution' }],
        x_mitre_is_subtechnique: false,
        x_mitre_domains: ['enterprise-attack'],
        x_mitre_platforms: ['Windows'],
        object_marking_refs: [markingDefinitionId],
      },
    });

    const relationshipTimestamp = new Date().toISOString();
    relationship = await post('/api/relationships', {
      workspace: {
        workflow: { state: 'work-in-progress' },
        relationship_endpoints: {
          source: {
            object_ref: target.stix.id,
            object_modified: target.stix.modified,
          },
          target: {
            object_ref: source.stix.id,
            object_modified: source.stix.modified,
          },
        },
      },
      stix: {
        type: 'relationship',
        spec_version: '2.1',
        created: relationshipTimestamp,
        modified: relationshipTimestamp,
        relationship_type: 'uses',
        source_ref: source.stix.id,
        target_ref: target.stix.id,
        object_marking_refs: [markingDefinitionId],
      },
    });
  });

  it('stores server-resolved exact endpoint revisions outside the STIX payload', function () {
    expect(relationship.workspace.relationship_endpoints).toEqual({
      source: {
        object_ref: source.stix.id,
        object_modified: source.stix.modified,
      },
      target: {
        object_ref: target.stix.id,
        object_modified: target.stix.modified,
      },
    });
    expect(relationship.stix.x_mitre_source_ref_modified).toBeUndefined();
    expect(relationship.stix.x_mitre_target_ref_modified).toBeUndefined();
  });

  it('creates a new SRO revision when an endpoint advances', async function () {
    const sourceRevision = cloneForCreate(source);
    sourceRevision.stix.modified = new Date(
      new Date(source.stix.modified).getTime() + 1000,
    ).toISOString();
    sourceRevision.stix.description = 'A newer source revision.';

    const newSource = await post('/api/software', sourceRevision);
    const response = await request(app)
      .get(`/api/relationships/${relationship.stix.id}?versions=all`)
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(200);

    expect(response.body).toHaveLength(2);
    const [latestRelationship, originalRelationship] = response.body;
    expect(latestRelationship.stix.id).toBe(relationship.stix.id);
    expect(latestRelationship.stix.modified).not.toBe(originalRelationship.stix.modified);
    expect(latestRelationship.workspace.relationship_endpoints.source).toEqual({
      object_ref: source.stix.id,
      object_modified: newSource.stix.modified,
    });
    expect(latestRelationship.workspace.relationship_endpoints.target).toEqual({
      object_ref: target.stix.id,
      object_modified: target.stix.modified,
    });
    expect(originalRelationship.workspace.relationship_endpoints.source).toEqual({
      object_ref: source.stix.id,
      object_modified: source.stix.modified,
    });
  });

  it('does not emit internal endpoint pins in STIX bundles', async function () {
    const response = await request(app)
      .get('/api/release-tracks/ephemeral/enterprise?includeToc=false')
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(200);

    const emittedRelationship = response.body.objects.find(
      (object) => object.id === relationship.stix.id,
    );
    expect(emittedRelationship).toBeDefined();
    expect(emittedRelationship.workspace).toBeUndefined();
    expect(emittedRelationship.x_mitre_source_ref_modified).toBeUndefined();
    expect(emittedRelationship.x_mitre_target_ref_modified).toBeUndefined();
  });

  after(async function () {
    await database.closeConnection();
  });
});
