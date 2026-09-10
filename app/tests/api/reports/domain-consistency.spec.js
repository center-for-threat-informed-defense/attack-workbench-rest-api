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

describe('GET /api/reports/domain-consistency', function () {
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

  function authenticated(builder) {
    return builder
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`);
  }

  async function post(path, body, status = 201) {
    return (await authenticated(request(app).post(path).send(body)).expect(status)).body;
  }

  it('reports relationships whose endpoints share no domain and objects lacking domains', async function () {
    const enterprise = await post(
      '/api/techniques',
      technique('Enterprise Only', ['enterprise-attack']),
    );
    const mobile = await post('/api/techniques', technique('Mobile Only', ['mobile-attack']));
    const both = await post(
      '/api/techniques',
      technique('Enterprise And Mobile', ['enterprise-attack', 'mobile-attack']),
    );
    const cross = await post('/api/relationships', relationship(enterprise, mobile));
    const shared = await post('/api/relationships', relationship(mobile, both));
    const deprecatedCross = await post(
      '/api/relationships',
      relationship(mobile, enterprise, { x_mitre_deprecated: true }),
    );

    // A domain-bearing object with no domains, inserted directly because the
    // API's work-in-progress schemas are the only route that tolerates it.
    const domainless = technique('No Domains', []);
    domainless.stix.id = 'attack-pattern--6c2f0f0e-1c0e-4d7c-9d3f-2b1b6f4b7a10';
    domainless.stix.kill_chain_phases = [
      { kill_chain_name: 'mitre-attack', phase_name: 'persistence' },
    ];
    delete domainless.stix.x_mitre_domains;
    await new Technique(domainless).save();

    const report = (
      await authenticated(request(app).get('/api/reports/domain-consistency')).expect(200)
    ).body;

    const crossIds = report.cross_domain_relationships.map((entry) => entry.stix.id);
    expect(crossIds).toContain(cross.stix.id);
    expect(crossIds).not.toContain(shared.stix.id);
    expect(crossIds).not.toContain(deprecatedCross.stix.id);

    const entry = report.cross_domain_relationships.find((item) => item.stix.id === cross.stix.id);
    expect(entry.source_object.stix.id).toBe(enterprise.stix.id);
    expect(entry.target_object.stix.id).toBe(mobile.stix.id);
    expect(entry.source_domains).toEqual(['enterprise-attack']);
    expect(entry.target_domains).toEqual(['mobile-attack']);

    const missingIds = report.objects_without_domains.map((item) => item.stix.id);
    expect(missingIds).toContain(domainless.stix.id);
    expect(missingIds).not.toContain(enterprise.stix.id);

    expect(report.summary).toEqual({
      cross_domain_relationship_count: report.cross_domain_relationships.length,
      objects_without_domains_count: report.objects_without_domains.length,
    });
  });

  it('evaluates the latest revision of each endpoint', async function () {
    const enterprise = await post(
      '/api/techniques',
      technique('Moves To Mobile', ['enterprise-attack']),
    );
    const mobile = await post('/api/techniques', technique('Stays Mobile', ['mobile-attack']));
    const edge = await post('/api/relationships', relationship(enterprise, mobile));

    let report = (
      await authenticated(request(app).get('/api/reports/domain-consistency')).expect(200)
    ).body;
    expect(report.cross_domain_relationships.map((entry) => entry.stix.id)).toContain(edge.stix.id);

    // A newer revision that adds the shared domain resolves the finding.
    const revised = technique('Moves To Mobile', ['enterprise-attack', 'mobile-attack']);
    revised.stix.id = enterprise.stix.id;
    revised.stix.created = enterprise.stix.created;
    await post('/api/techniques', revised);

    report = (await authenticated(request(app).get('/api/reports/domain-consistency')).expect(200))
      .body;
    expect(report.cross_domain_relationships.map((entry) => entry.stix.id)).not.toContain(
      edge.stix.id,
    );
  });
});
