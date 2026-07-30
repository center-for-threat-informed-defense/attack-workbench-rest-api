const request = require('supertest');
const { expect } = require('expect');

const config = require('../../../config/config');
const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');
const login = require('../../shared/login');
const { cloneForCreate } = require('../../shared/clone-for-create');

const staticMarkingDefinitionId = 'marking-definition--613f2e26-407d-48c7-9eca-b8e91df99dc9';

describe('Virtual Release Track Domain Filters API', function () {
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

  async function post(path, body, status = 201) {
    const response = await request(app)
      .post(path)
      .send(body)
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(status);
    return response.body;
  }

  function buildMitigation(name, domains) {
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
        x_mitre_domains: domains,
        object_marking_refs: [staticMarkingDefinitionId],
      },
    };
  }

  function buildMatrix(name, externalDomain) {
    const timestamp = new Date().toISOString();
    return {
      workspace: { workflow: { state: 'work-in-progress' } },
      stix: {
        created: timestamp,
        modified: timestamp,
        name,
        description: `${name} description`,
        spec_version: '2.1',
        type: 'x-mitre-matrix',
        external_references: [{ source_name: 'test-source', external_id: externalDomain }],
        object_marking_refs: [staticMarkingDefinitionId],
        x_mitre_version: '1.0',
      },
    };
  }

  async function createVirtualSnapshot(name, componentTrackId, domains) {
    const virtual = await post('/api/release-tracks/new', {
      name,
      type: 'virtual',
      composition: {
        component_tracks: [
          {
            track_id: componentTrackId,
            resolution_strategy: 'latest_tagged',
            priority: 0,
            filters: { domains },
          },
        ],
        deduplication: { strategy: 'prioritize_latest_object' },
      },
    });
    return post(`/api/release-tracks/${virtual.id}/virtual/snapshots/create`, {});
  }

  it('filters exact pinned revisions by normalized ATT&CK domains', async function () {
    const enterprise = await post(
      '/api/mitigations',
      buildMitigation('Enterprise Domain Member', ['enterprise-attack']),
    );
    const ics = await post(
      '/api/mitigations',
      buildMitigation('ICS Domain Member', ['ics-attack']),
    );
    const shared = await post(
      '/api/mitigations',
      buildMitigation('Shared Domain Member', ['enterprise-attack', 'ics-attack']),
    );
    const noDomain = await post('/api/mitigations', buildMitigation('No Domain Member', undefined));
    const enterpriseMatrix = await post(
      '/api/matrices',
      buildMatrix('Domainless Enterprise Matrix', 'enterprise-attack'),
    );

    const component = await post('/api/release-tracks/new', {
      name: 'Domain Filter Component',
      type: 'standard',
    });
    await post(
      `/api/release-tracks/${component.id}/contents?confirm_track_id=${component.id}`,
      {
        x_mitre_contents: [enterprise, ics, shared, noDomain, enterpriseMatrix].map((object) => ({
          obj_ref: object.stix.id,
          obj_modified: object.stix.modified,
        })),
      },
      200,
    );
    await post(`/api/release-tracks/${component.id}/snapshots/latest/release`, {}, 200);

    // A newer revision has a different domain, but virtual composition must
    // evaluate the exact revision pinned in the tagged component snapshot.
    const newerEnterpriseRevision = cloneForCreate(enterprise);
    newerEnterpriseRevision.stix.modified = new Date(Date.now() + 1000).toISOString();
    newerEnterpriseRevision.stix.x_mitre_domains = ['ics-attack'];
    await post('/api/mitigations', newerEnterpriseRevision);

    const enterpriseSnapshot = await createVirtualSnapshot(
      'Enterprise Domain Virtual',
      component.id,
      ['enterprise'],
    );
    const enterpriseIds = enterpriseSnapshot.members.map((member) => member.object_ref);
    expect(enterpriseIds).toEqual(
      expect.arrayContaining([enterprise.stix.id, shared.stix.id, enterpriseMatrix.stix.id]),
    );
    expect(enterpriseIds).not.toContain(ics.stix.id);
    expect(enterpriseIds).not.toContain(noDomain.stix.id);

    const icsSnapshot = await createVirtualSnapshot('ICS Domain Virtual', component.id, [
      'ics-attack',
    ]);
    const icsIds = icsSnapshot.members.map((member) => member.object_ref);
    expect(icsIds).toEqual(expect.arrayContaining([ics.stix.id, shared.stix.id]));
    expect(icsIds).not.toContain(enterprise.stix.id);
    expect(icsIds).not.toContain(enterpriseMatrix.stix.id);
    expect(icsIds).not.toContain(noDomain.stix.id);
  });

  after(async function () {
    await database.closeConnection();
  });
});
