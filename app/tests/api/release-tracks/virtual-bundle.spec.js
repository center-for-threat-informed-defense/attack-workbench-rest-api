'use strict';

const request = require('supertest');
const { expect } = require('expect');

const config = require('../../../config/config');
const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');
const login = require('../../shared/login');
const { releaseExactMembers } = require('./release-track-test-helpers');

const staticMarkingDefinitionId = 'marking-definition--613f2e26-407d-48c7-9eca-b8e91df99dc9';

describe('Virtual Release Track Bundle Export API', function () {
  let app;
  let passportCookie;
  let malware;
  let virtualTrack;
  let virtualSnapshot;

  before(async function () {
    await database.initializeConnection();
    await databaseConfiguration.checkSystemConfiguration();

    config.validateRequests.withAttackDataModel = true;
    config.validateRequests.withOpenApi = true;

    app = await require('../../../index').initializeApp();
    passportCookie = await login.loginAnonymous(app);

    malware = await post('/api/software', buildMalware('Virtual Bundle Malware'));

    const componentTrack = await post('/api/release-tracks/new', {
      name: 'Virtual Bundle Component',
      type: 'standard',
    });
    await releaseExactMembers(app, passportCookie, componentTrack.id, [malware]);

    virtualTrack = await post('/api/release-tracks/new', {
      name: 'Virtual Bundle Track',
      type: 'virtual',
      composition: {
        component_tracks: [
          {
            track_id: componentTrack.id,
            resolution_strategy: 'latest_tagged',
            priority: 0,
          },
        ],
        deduplication: { strategy: 'prioritize_latest_object' },
      },
    });
    virtualSnapshot = await post(
      `/api/release-tracks/${virtualTrack.id}/virtual/snapshots/create`,
      {},
    );
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

  async function get(path) {
    const response = await request(app)
      .get(path)
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(200);
    return response.body;
  }

  function buildMalware(name) {
    const timestamp = new Date().toISOString();
    return {
      workspace: { workflow: { state: 'work-in-progress' } },
      stix: {
        created: timestamp,
        modified: timestamp,
        name,
        description: `${name} description`,
        spec_version: '2.1',
        type: 'malware',
        is_family: true,
        object_marking_refs: [staticMarkingDefinitionId],
        x_mitre_version: '1.0',
        x_mitre_aliases: [name],
        x_mitre_platforms: ['Windows'],
        x_mitre_domains: ['enterprise-attack'],
      },
    };
  }

  it('emits materialized virtual snapshots as STIX 2.1 bundles by default', async function () {
    const bundle = await get(
      `/api/release-tracks/${virtualTrack.id}/snapshots/latest?format=bundle`,
    );

    expect(bundle.type).toBe('bundle');
    expect(bundle.spec_version).toBeUndefined();
    expect(bundle.objects[0]).toMatchObject({
      type: 'x-mitre-collection',
      spec_version: '2.1',
    });

    const exportedMalware = bundle.objects.find((object) => object.id === malware.stix.id);
    expect(exportedMalware).toMatchObject({
      type: 'malware',
      spec_version: '2.1',
      is_family: true,
    });
    expect(exportedMalware.labels).toBeUndefined();
  });

  it('emits materialized virtual snapshots as STIX 2.0 bundles on request', async function () {
    const bundle = await get(
      `/api/release-tracks/${virtualTrack.id}/snapshots/` +
        `${encodeURIComponent(virtualSnapshot.modified)}?format=bundle&stixVersion=2.0`,
    );

    expect(bundle.type).toBe('bundle');
    expect(bundle.spec_version).toBe('2.0');
    expect(bundle.objects.every((object) => object.spec_version === undefined)).toBe(true);

    const exportedMalware = bundle.objects.find((object) => object.id === malware.stix.id);
    expect(exportedMalware).toMatchObject({
      type: 'malware',
      labels: ['malware'],
    });
    expect(exportedMalware.is_family).toBeUndefined();
  });

  after(async function () {
    await database.closeConnection();
  });
});
