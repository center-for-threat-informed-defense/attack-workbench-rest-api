/**
 * Ephemeral Bundle Export Tests
 * ==============================
 *
 * Regression tests for GET /api/release-tracks/ephemeral/:domain, which
 * supplants the deprecated GET /api/stix-bundles endpoint.
 *
 * Covered behavior:
 *   - Bundle generation preserves the legacy stix-bundles object-selection
 *     logic (secondary objects such as groups are pulled in via
 *     relationships, referenced identities/markings are included)
 *   - A table-of-contents (x-mitre-collection) object is included by default
 *     with the ephemeral defaults: x_mitre_version '0.1' and the global
 *     default ATT&CK spec version
 *   - includeToc=false omits the TOC
 *   - includeObjectsWithMissingAttackId (renamed from includeMissingAttackId)
 *   - includeDeprecated / includeRevoked (also govern deprecated data
 *     sources, replacing the removed includeDataSources parameter)
 *   - stixVersion ('2.0' | '2.1', default '2.1')
 *   - format=workbench still returns the Workbench document shape
 */

const request = require('supertest');
const { expect } = require('expect');

const config = require('../../../config/config');
const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');
const login = require('../../shared/login');
const AttackObject = require('../../../models/attack-object-model');

const logger = require('../../../lib/logger');
logger.level = 'debug';

// Seeded by databaseConfiguration.checkSystemConfiguration()
const staticMarkingDefinitionId = 'marking-definition--613f2e26-407d-48c7-9eca-b8e91df99dc9';

const enterpriseDomain = 'enterprise-attack';
const icsDomain = 'ics-attack';

describe('Ephemeral Bundle API', function () {
  let app;
  let passportCookie;

  let enterpriseTechnique;
  let noAttackIdTechnique;
  let deprecatedTechnique;
  let revokedTechnique;
  let icsTechnique;
  let group;
  let relationship;

  before(async function () {
    await database.initializeConnection();
    await databaseConfiguration.checkSystemConfiguration();

    config.validateRequests.withAttackDataModel = true;
    config.validateRequests.withOpenApi = true;

    app = await require('../../../index').initializeApp();
    passportCookie = await login.loginAnonymous(app);
  });

  async function postObject(path, body) {
    const res = await request(app)
      .post(path)
      .send(body)
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(201)
      .expect('Content-Type', /json/);
    return res.body;
  }

  async function getEphemeral(query = '', expectedStatus = 200) {
    const res = await request(app)
      .get(`/api/release-tracks/ephemeral/enterprise${query}`)
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(expectedStatus);
    return res.body;
  }

  function buildTechnique(name, domains, overrides = {}) {
    const timestamp = new Date().toISOString();
    return {
      workspace: {
        workflow: {
          state: 'work-in-progress',
        },
      },
      stix: {
        created: timestamp,
        modified: timestamp,
        name,
        description: `Description for ${name}`,
        spec_version: '2.1',
        type: 'attack-pattern',
        object_marking_refs: [staticMarkingDefinitionId],
        kill_chain_phases: [{ kill_chain_name: 'mitre-attack', phase_name: 'persistence' }],
        x_mitre_is_subtechnique: false,
        x_mitre_platforms: ['Windows'],
        x_mitre_domains: domains,
        ...overrides,
      },
    };
  }

  function bundleObjectIds(bundle) {
    return bundle.objects.map((o) => o.id);
  }

  before('set up domain objects', async function () {
    enterpriseTechnique = await postObject(
      '/api/techniques',
      buildTechnique('Enterprise Technique', [enterpriseDomain]),
    );

    icsTechnique = await postObject(
      '/api/techniques',
      buildTechnique('ICS Technique', [icsDomain]),
    );

    deprecatedTechnique = await postObject(
      '/api/techniques',
      buildTechnique('Deprecated Technique', [enterpriseDomain], { x_mitre_deprecated: true }),
    );

    // 'revoked' is server-controlled on create, so set it directly
    revokedTechnique = await postObject(
      '/api/techniques',
      buildTechnique('Revoked Technique', [enterpriseDomain]),
    );
    await AttackObject.updateOne(
      { 'stix.id': revokedTechnique.stix.id, 'stix.modified': revokedTechnique.stix.modified },
      { $set: { 'stix.revoked': true } },
    );

    // The server auto-generates ATT&CK IDs for techniques, so strip the
    // generated external reference to simulate an object with a missing
    // ATT&CK ID
    noAttackIdTechnique = await postObject(
      '/api/techniques',
      buildTechnique('No AttackId Technique', [enterpriseDomain]),
    );
    await AttackObject.updateOne(
      {
        'stix.id': noAttackIdTechnique.stix.id,
        'stix.modified': noAttackIdTechnique.stix.modified,
      },
      { $set: { 'stix.external_references': [] }, $unset: { 'workspace.attack_id': '' } },
    );

    // Group (secondary object): pulled into the bundle via its relationship
    // to the enterprise technique
    group = await postObject('/api/groups', {
      workspace: { workflow: { state: 'work-in-progress' } },
      stix: {
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        name: 'Ephemeral Test Group',
        spec_version: '2.1',
        type: 'intrusion-set',
        description: 'Group used to verify secondary-object inclusion.',
        object_marking_refs: [staticMarkingDefinitionId],
      },
    });

    relationship = await postObject('/api/relationships', {
      workspace: { workflow: { state: 'work-in-progress' } },
      stix: {
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        spec_version: '2.1',
        type: 'relationship',
        relationship_type: 'uses',
        source_ref: group.stix.id,
        target_ref: enterpriseTechnique.stix.id,
        object_marking_refs: [staticMarkingDefinitionId],
      },
    });
  });

  it('GET /api/release-tracks/ephemeral/:domain returns a STIX 2.1 bundle with legacy-parity contents', async function () {
    const bundle = await getEphemeral();

    expect(bundle.type).toBe('bundle');
    expect(bundle.id).toMatch(/^bundle--/);
    // STIX 2.1 removed spec_version from the bundle object
    expect(bundle.spec_version).toBeUndefined();

    const ids = bundleObjectIds(bundle);

    // Primary object from the requested domain
    expect(ids).toContain(enterpriseTechnique.stix.id);

    // Secondary object (group) discovered through its 'uses' relationship
    expect(ids).toContain(group.stix.id);
    expect(ids).toContain(relationship.stix.id);

    // The group's domains are inferred from the technique it uses
    const bundleGroup = bundle.objects.find((o) => o.id === group.stix.id);
    expect(bundleGroup.x_mitre_domains).toEqual([enterpriseDomain]);

    // Referenced supporting objects
    expect(ids).toContain(enterpriseTechnique.stix.created_by_ref);
    expect(ids).toContain(staticMarkingDefinitionId);

    // Excluded by default: wrong domain, deprecated, revoked, missing ATT&CK ID
    expect(ids).not.toContain(icsTechnique.stix.id);
    expect(ids).not.toContain(deprecatedTechnique.stix.id);
    expect(ids).not.toContain(revokedTechnique.stix.id);
    expect(ids).not.toContain(noAttackIdTechnique.stix.id);
  });

  it('includes a TOC object with ephemeral defaults', async function () {
    const bundle = await getEphemeral();

    const toc = bundle.objects[0];
    expect(toc.type).toBe('x-mitre-collection');
    expect(toc.name).toBe('Enterprise ATT&CK');
    // '0.1' signifies an ephemerally generated collection that is not
    // connected to a release track
    expect(toc.x_mitre_version).toBe('0.1');
    expect(toc.x_mitre_attack_spec_version).toBe(config.app.attackSpecVersion);
    expect(toc.spec_version).toBe('2.1');
    expect(typeof toc.modified).toBe('string');

    const contentRefs = toc.x_mitre_contents.map((entry) => entry.object_ref);
    expect(contentRefs).toContain(enterpriseTechnique.stix.id);
    expect(toc.object_marking_refs).toContain(staticMarkingDefinitionId);
  });

  it('includeToc=false omits the TOC object', async function () {
    const bundle = await getEphemeral('?includeToc=false');
    const tocObjects = bundle.objects.filter((o) => o.type === 'x-mitre-collection');
    expect(tocObjects.length).toBe(0);
  });

  it('includeObjectsWithMissingAttackId=true includes objects without ATT&CK IDs', async function () {
    const bundle = await getEphemeral('?includeObjectsWithMissingAttackId=true');
    expect(bundleObjectIds(bundle)).toContain(noAttackIdTechnique.stix.id);
  });

  it('includeDeprecated=true includes deprecated objects', async function () {
    const bundle = await getEphemeral('?includeDeprecated=true');
    expect(bundleObjectIds(bundle)).toContain(deprecatedTechnique.stix.id);
  });

  it('includeRevoked=true includes revoked objects', async function () {
    const bundle = await getEphemeral('?includeRevoked=true');
    expect(bundleObjectIds(bundle)).toContain(revokedTechnique.stix.id);
  });

  it('stixVersion=2.0 conforms the bundle to STIX 2.0', async function () {
    const bundle = await getEphemeral('?stixVersion=2.0');

    expect(bundle.spec_version).toBe('2.0');
    const technique = bundle.objects.find((o) => o.id === enterpriseTechnique.stix.id);
    expect(technique.spec_version).toBeUndefined();
  });

  it('rejects invalid query parameter values', async function () {
    await getEphemeral('?stixVersion=1.0', 400);
    await getEphemeral('?includeToc=maybe', 400);
  });

  it('format=workbench returns the Workbench document shape', async function () {
    const result = await getEphemeral('?format=workbench');

    expect(result.collection).toBeDefined();
    expect(Array.isArray(result.objects)).toBe(true);
    const technique = result.objects.find((o) => o.stix.id === enterpriseTechnique.stix.id);
    expect(technique).toBeDefined();
    expect(technique.workspace).toBeDefined();
  });

  it('format=filesystemstore returns 501', async function () {
    await getEphemeral('?format=filesystemstore', 501);
  });

  it('rejects an unknown domain', async function () {
    await request(app)
      .get('/api/release-tracks/ephemeral/unknown-domain')
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(400);
  });

  after(async function () {
    await database.closeConnection();
  });
});
