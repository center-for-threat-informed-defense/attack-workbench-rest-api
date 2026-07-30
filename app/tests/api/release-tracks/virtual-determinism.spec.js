'use strict';

const request = require('supertest');
const { expect } = require('expect');

const config = require('../../../config/config');
const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');
const modelFactory = require('../../../models/release-tracks/model-factory');
const login = require('../../shared/login');
const { cloneForCreate } = require('../../shared/clone-for-create');

const staticMarkingDefinitionId = 'marking-definition--613f2e26-407d-48c7-9eca-b8e91df99dc9';

describe('Virtual release-track deterministic membership API', function () {
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

  async function get(path) {
    const response = await request(app)
      .get(path)
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(200);
    return response.body;
  }

  async function post(path, body, status = 201) {
    const response = await request(app)
      .post(path)
      .send(body)
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(status);
    return response.body;
  }

  function buildMitigation(name) {
    const timestamp = new Date().toISOString();
    return {
      workspace: { workflow: { state: 'work-in-progress' } },
      stix: {
        created: timestamp,
        modified: timestamp,
        name,
        description: `${name} description`,
        spec_version: '2.1',
        type: 'course-of-action',
        labels: ['test'],
        x_mitre_version: '1.0',
        x_mitre_domains: ['enterprise-attack'],
        object_marking_refs: [staticMarkingDefinitionId],
      },
    };
  }

  async function createRevision(name, previous) {
    const body = previous ? cloneForCreate(previous) : buildMitigation(name);
    if (previous) {
      body.stix.name = name;
      body.stix.modified = new Date(
        new Date(previous.stix.modified).getTime() + 1000,
      ).toISOString();
    }
    return post('/api/mitigations', body);
  }

  async function createReleasedComponent(name, member, modified = member.stix.modified) {
    const component = await post('/api/release-tracks/new', {
      name,
      type: 'standard',
    });
    const contents = await post(
      `/api/release-tracks/${component.id}/contents`,
      {
        x_mitre_contents: [
          {
            obj_ref: member.stix.id,
            obj_modified: modified,
          },
        ],
      },
      200,
    );
    await post(`/api/release-tracks/${component.id}/snapshots/latest/release`, {}, 200);
    return { component, contents };
  }

  async function createVirtual(name, componentTrackId) {
    return post('/api/release-tracks/new', {
      name,
      type: 'virtual',
      composition: {
        component_tracks: [
          {
            track_id: componentTrackId,
            resolution_strategy: 'latest_tagged',
            priority: 1,
          },
        ],
        deduplication: { strategy: 'prioritize_latest_object' },
      },
    });
  }

  function revisionKeys(snapshot) {
    return (snapshot.members || []).map(
      (member) => `${member.object_ref}::${new Date(member.object_modified).toISOString()}`,
    );
  }

  it('resolves latest shorthand before persistence and freezes the tagged component revision', async function () {
    const revisionA = await createRevision('Deterministic Member A');
    const { component, contents } = await createReleasedComponent(
      'Deterministic Exact Component',
      revisionA,
      'latest',
    );

    expect(contents.members).toEqual([
      {
        object_ref: revisionA.stix.id,
        object_modified: revisionA.stix.modified,
      },
    ]);

    // The standard track's default track_latest policy enrolls this new
    // revision into a draft candidate. It must not alter the already-tagged
    // component snapshot selected by virtual composition.
    const revisionB = await createRevision('Deterministic Member B', revisionA);
    const virtual = await createVirtual('Deterministic Exact Virtual', component.id);
    const materialized = await post(
      `/api/release-tracks/${virtual.id}/virtual/snapshots/create`,
      {},
    );

    expect(materialized.members).toEqual([
      {
        object_ref: revisionA.stix.id,
        object_modified: revisionA.stix.modified,
      },
    ]);
    expect(materialized.members[0].object_modified).not.toBe(revisionB.stix.modified);

    const firstLatest = await get(`/api/release-tracks/${virtual.id}/snapshots/latest`);
    const explicit = await get(
      `/api/release-tracks/${virtual.id}/snapshots/${encodeURIComponent(materialized.modified)}`,
    );

    await createRevision('Deterministic Member C', revisionB);
    const secondLatest = await get(`/api/release-tracks/${virtual.id}/snapshots/latest`);

    expect(revisionKeys(firstLatest)).toEqual(revisionKeys(materialized));
    expect(revisionKeys(explicit)).toEqual(revisionKeys(materialized));
    expect(revisionKeys(secondLatest)).toEqual(revisionKeys(materialized));
  });

  it('locks a legacy moving component member to an exact revision during materialization', async function () {
    const revisionA = await createRevision('Legacy Moving Member A');
    const { component } = await createReleasedComponent('Legacy Moving Component', revisionA);
    const revisionB = await createRevision('Legacy Moving Member B', revisionA);

    // Bypass Mongoose to simulate data created before exact Date-valued member
    // pins were enforced. The virtual materialization boundary must consume
    // the shorthand but never copy it into the virtual snapshot.
    const ComponentModel = modelFactory.getModel(component.id);
    await ComponentModel.collection.updateOne(
      { id: component.id, version: '1.0' },
      { $set: { 'members.0.object_modified': 'latest' } },
    );

    const virtual = await createVirtual('Legacy Moving Virtual', component.id);
    const materialized = await post(
      `/api/release-tracks/${virtual.id}/virtual/snapshots/create`,
      {},
    );

    expect(materialized.members).toEqual([
      {
        object_ref: revisionB.stix.id,
        object_modified: revisionB.stix.modified,
      },
    ]);
    expect(materialized.members[0].object_modified).not.toBe('latest');
  });

  after(async function () {
    await database.closeConnection();
  });
});
