const request = require('supertest');
const { expect } = require('expect');

const { cloneForCreate } = require('../../shared/clone-for-create');

const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');
const Campaign = require('../../../models/campaign-model');
const campaignsService = require('../../../services/stix/campaigns-service');
const markingDefinitionService = require('../../../services/stix/marking-definitions-service');
const systemConfigurationService = require('../../../services/system/system-configuration-service');

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
    name: 'campaign-1',
    spec_version: '2.1',
    type: 'campaign',
    description: 'This is the initial campaign. Blue.',
    aliases: ['campaign by another name'],
    first_seen: '2016-04-06T00:00:00.000Z',
    last_seen: '2016-07-12T00:00:00.000Z',
    x_mitre_first_seen_citation: '(Citation: Blue Spotter 1)',
    x_mitre_last_seen_citation: '(Citation: Blue Spotter 2)',
    created_by_ref: 'identity--6444f546-6900-4456-b3b1-015c88d70dab',
  },
};

const markingDefinitionData = {
  workspace: {
    workflow: {
      state: 'reviewed',
    },
  },
  stix: {
    spec_version: '2.1',
    type: 'marking-definition',
    definition_type: 'statement',
    definition: { statement: 'This is a marking definition.' },
    created_by_ref: 'identity--6444f546-6900-4456-b3b1-015c88d70dab',
  },
};

async function addDefaultMarkingDefinition(markingDefinitionData) {
  // Save the marking definition
  const timestamp = new Date().toISOString();
  markingDefinitionData.stix.created = timestamp;
  const savedMarkingDefinition = await markingDefinitionService.create(markingDefinitionData);

  // Get the current list of default marking definitions
  const defaultMarkingDefinitions =
    await systemConfigurationService.retrieveDefaultMarkingDefinitions({ refOnly: true });

  // Add the new marking definition to the list and save it
  defaultMarkingDefinitions.push(savedMarkingDefinition.stix.id);
  await systemConfigurationService.setDefaultMarkingDefinitions(defaultMarkingDefinitions);

  return savedMarkingDefinition;
}

describe('Campaigns API', function () {
  let app;
  let defaultMarkingDefinition1;
  let defaultMarkingDefinition2;
  let passportCookie;

  before(async function () {
    // Establish the database connection
    // Use an in-memory database that we spin up for the test
    await database.initializeConnection();

    // Wait until the indexes are created
    await Campaign.init();

    // Check for a valid database configuration
    await databaseConfiguration.checkSystemConfiguration();

    // Enable ADM validation; the request payloads in this spec are ADM-compliant
    config.validateRequests.withAttackDataModel = true;
    config.validateRequests.withOpenApi = true;

    // Initialize the express app
    app = await require('../../../index').initializeApp();

    // Log into the app
    passportCookie = await login.loginAnonymous(app);

    defaultMarkingDefinition1 = await addDefaultMarkingDefinition(markingDefinitionData);
  });

  it('GET /api/campaigns returns an empty array of campaigns', async function () {
    const res = await request(app)
      .get('/api/campaigns')
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    // We expect to get an empty array
    const campaigns = res.body;
    expect(campaigns).toBeDefined();
    expect(Array.isArray(campaigns)).toBe(true);
    expect(campaigns.length).toBe(0);
  });

  it('POST /api/campaigns does not create an empty campaign', async function () {
    const body = {};
    await request(app)
      .post('/api/campaigns')
      .send(body)
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(400);
  });

  let campaign1;
  it('POST /api/campaigns creates a campaign', async function () {
    const timestamp = new Date().toISOString();
    initialObjectData.stix.created = timestamp;
    initialObjectData.stix.modified = timestamp;
    const body = cloneForCreate(initialObjectData);
    const res = await request(app)
      .post('/api/campaigns')
      .send(body)
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(201)
      .expect('Content-Type', /json/);

    // We expect to get the created campaign
    campaign1 = res.body;
    expect(campaign1).toBeDefined();
    expect(campaign1.stix).toBeDefined();
    expect(campaign1.stix.id).toBeDefined();
    expect(campaign1.stix.created).toBeDefined();
    expect(campaign1.stix.modified).toBeDefined();
    expect(campaign1.stix.first_seen).toBeDefined();
    expect(campaign1.stix.last_seen).toBeDefined();
    expect(campaign1.stix.x_mitre_first_seen_citation).toBeDefined();
    expect(campaign1.stix.x_mitre_last_seen_citation).toBeDefined();
    expect(campaign1.stix.x_mitre_attack_spec_version).toBe(config.app.attackSpecVersion);

    expect(campaign1.stix.aliases).toBeDefined();
    expect(Array.isArray(campaign1.stix.aliases)).toBe(true);
    expect(campaign1.stix.aliases.length).toBe(2);
    expect(campaign1.stix.aliases[0]).toBe(campaign1.stix.name);

    // object_marking_refs should contain the default marking definition
    expect(campaign1.stix.object_marking_refs).toBeDefined();
    expect(Array.isArray(campaign1.stix.object_marking_refs)).toBe(true);
    expect(campaign1.stix.object_marking_refs.length).toBe(1);
    expect(campaign1.stix.object_marking_refs[0]).toBe(defaultMarkingDefinition1.stix.id);
  });

  it('GET /api/campaigns returns the added campaign', async function () {
    const res = await request(app)
      .get('/api/campaigns')
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    // We expect to get one campaign in an array
    const campaigns = res.body;
    expect(campaigns).toBeDefined();
    expect(Array.isArray(campaigns)).toBe(true);
    expect(campaigns.length).toBe(1);
  });

  it('GET /api/campaigns/:id should not return a campaign when the id cannot be found', async function () {
    await request(app)
      .get('/api/campaigns/not-an-id')
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(404);
  });

  it('GET /api/campaigns/:id returns the added campaign', async function () {
    const res = await request(app)
      .get('/api/campaigns/' + campaign1.stix.id)
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    // We expect to get one campaign in an array
    const campaigns = res.body;
    expect(campaigns).toBeDefined();
    expect(Array.isArray(campaigns)).toBe(true);
    expect(campaigns.length).toBe(1);

    const campaign = campaigns[0];
    expect(campaign).toBeDefined();
    expect(campaign.stix).toBeDefined();
    expect(campaign.stix.id).toBe(campaign1.stix.id);
    expect(campaign.stix.type).toBe(campaign1.stix.type);
    expect(campaign.stix.name).toBe(campaign1.stix.name);
    expect(campaign.stix.description).toBe(campaign1.stix.description);
    expect(campaign.stix.spec_version).toBe(campaign1.stix.spec_version);
    expect(campaign.stix.object_marking_refs).toEqual(
      expect.arrayContaining(campaign1.stix.object_marking_refs),
    );
    expect(campaign.stix.created_by_ref).toBe(campaign1.stix.created_by_ref);
    expect(campaign.stix.x_mitre_attack_spec_version).toBe(
      campaign1.stix.x_mitre_attack_spec_version,
    );
  });

  it('PUT /api/campaigns rejects STIX changes to a persisted revision', async function () {
    const body = structuredClone(campaign1);
    body.stix.description = 'This is an updated campaign. Blue.';
    const res = await request(app)
      .put('/api/campaigns/' + campaign1.stix.id + '/modified/' + campaign1.stix.modified)
      .send(body)
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(409)
      .expect('Content-Type', /json/);

    expect(res.body.message).toContain('immutable');
  });

  it('POST /api/campaigns does not create a campaign with the same id and modified date', async function () {
    const body = cloneForCreate(campaign1);
    await request(app)
      .post('/api/campaigns')
      .send(body)
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(409);
  });

  let campaign2;
  it('POST /api/campaigns should create a new version of a campaign with a duplicate stix.id but different stix.modified date', async function () {
    // Add another default marking definition
    markingDefinitionData.stix.definition.statement =
      'This is the second default marking definition';
    defaultMarkingDefinition2 = await addDefaultMarkingDefinition(markingDefinitionData);

    campaign2 = cloneForCreate(campaign1);
    const timestamp = new Date().toISOString();
    campaign2.stix.modified = timestamp;
    campaign2.stix.description = 'This is a new version of a campaign. Green.';

    const body = campaign2;
    const res = await request(app)
      .post('/api/campaigns')
      .send(body)
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(201)
      .expect('Content-Type', /json/);

    // We expect to get the created campaign
    const campaign = res.body;
    expect(campaign).toBeDefined();
  });

  it('GET /api/campaigns returns the latest added campaign', async function () {
    const res = await request(app)
      .get('/api/campaigns/' + campaign2.stix.id)
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    // We expect to get one campaign in an array
    const campaigns = res.body;
    expect(campaigns).toBeDefined();
    expect(Array.isArray(campaigns)).toBe(true);
    expect(campaigns.length).toBe(1);
    const campaign = campaigns[0];
    expect(campaign.stix.id).toBe(campaign2.stix.id);
    expect(campaign.stix.modified).toBe(campaign2.stix.modified);

    // object_marking_refs should contain the two default marking definition
    expect(campaign.stix.object_marking_refs).toBeDefined();
    expect(Array.isArray(campaign.stix.object_marking_refs)).toBe(true);
    expect(campaign.stix.object_marking_refs.length).toBe(2);
    expect(campaign.stix.object_marking_refs.includes(defaultMarkingDefinition1.stix.id)).toBe(
      true,
    );
    expect(campaign.stix.object_marking_refs.includes(defaultMarkingDefinition2.stix.id)).toBe(
      true,
    );
  });

  it('GET /api/campaigns returns all added campaigns', async function () {
    const res = await request(app)
      .get('/api/campaigns/' + campaign1.stix.id + '?versions=all')
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    // We expect to get two campaigns in an array
    const campaigns = res.body;
    expect(campaigns).toBeDefined();
    expect(Array.isArray(campaigns)).toBe(true);
    expect(campaigns.length).toBe(2);
  });

  it('GET /api/campaigns/:id/modified/:modified returns the first added campaign', async function () {
    const res = await request(app)
      .get('/api/campaigns/' + campaign1.stix.id + '/modified/' + campaign1.stix.modified)
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    // We expect to get one campaign
    const campaign = res.body;
    expect(campaign).toBeDefined();
    expect(campaign.stix).toBeDefined();
    expect(campaign.stix.id).toBe(campaign1.stix.id);
    expect(campaign.stix.modified).toBe(campaign1.stix.modified);
  });

  it('GET /api/campaigns/:id/modified/:modified returns the second added campaign', async function () {
    const res = await request(app)
      .get('/api/campaigns/' + campaign2.stix.id + '/modified/' + campaign2.stix.modified)
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    // We expect to get one campaign
    const campaign = res.body;
    expect(campaign).toBeDefined();
    expect(campaign.stix).toBeDefined();
    expect(campaign.stix.id).toBe(campaign2.stix.id);
    expect(campaign.stix.modified).toBe(campaign2.stix.modified);
  });

  let campaign3;
  it('POST /api/campaigns should create a new campaign with a different stix.id', async function () {
    const campaign = cloneForCreate(initialObjectData);
    campaign.stix.id = undefined;
    const timestamp = new Date().toISOString();
    campaign.stix.created = timestamp;
    campaign.stix.modified = timestamp;
    campaign.stix.name = 'Mr. Brown';
    campaign.stix.description = 'This is a new campaign. Red.';
    const body = campaign;
    const res = await request(app)
      .post('/api/campaigns')
      .send(body)
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(201)
      .expect('Content-Type', /json/);

    // We expect to get the created campaign
    campaign3 = res.body;
    expect(campaign3).toBeDefined();
  });

  it('GET /api/campaigns uses the search parameter to return the latest version of the campaign', async function () {
    const res = await request(app)
      .get('/api/campaigns?search=green')
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    // We expect to get one campaign in an array
    const campaigns = res.body;
    expect(campaigns).toBeDefined();
    expect(Array.isArray(campaigns)).toBe(true);
    expect(campaigns.length).toBe(1);

    // We expect it to be the latest version of the campaign
    const campaign = campaigns[0];
    expect(campaign).toBeDefined();
    expect(campaign.stix).toBeDefined();
    expect(campaign.stix.id).toBe(campaign2.stix.id);
    expect(campaign.stix.modified).toBe(campaign2.stix.modified);
  });

  it('GET /api/campaigns should not get the first version of the campaign when using the search parameter', async function () {
    const res = await request(app)
      .get('/api/campaigns?search=blue')
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    // We expect to get zero campaigns in an array
    const campaigns = res.body;
    expect(campaigns).toBeDefined();
    expect(Array.isArray(campaigns)).toBe(true);
    expect(campaigns.length).toBe(0);
  });

  it('GET /api/campaigns uses the search parameter to return the campaign using the name property', async function () {
    const res = await request(app)
      .get('/api/campaigns?search=brown')
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    // We expect to get one campaign in an array
    const campaigns = res.body;
    expect(campaigns).toBeDefined();
    expect(Array.isArray(campaigns)).toBe(true);
    expect(campaigns.length).toBe(1);

    // We expect it to be the third campaign
    const campaign = campaigns[0];
    expect(campaign).toBeDefined();
    expect(campaign.stix).toBeDefined();
    expect(campaign.stix.id).toBe(campaign3.stix.id);
    expect(campaign.stix.modified).toBe(campaign3.stix.modified);
  });

  it('DELETE /api/campaigns/:id should not delete a campaign when the id cannot be found', async function () {
    await request(app)
      .delete('/api/campaigns/not-an-id')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(404);
  });

  it('DELETE /api/campaigns/:id/modified/:modified deletes a campaign', async function () {
    await request(app)
      .delete('/api/campaigns/' + campaign3.stix.id + '/modified/' + campaign3.stix.modified)
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(204);
  });

  it('DELETE /api/campaigns/:id should delete all of the campaigns with the stix id', async function () {
    await request(app)
      .delete('/api/campaigns/' + campaign2.stix.id)
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(204);
  });

  it('GET /api/campaigns returns an empty array of campaigns', async function () {
    const res = await request(app)
      .get('/api/campaigns')
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(200)
      .expect('Content-Type', /json/);

    // We expect to get an empty array
    const campaigns = res.body;
    expect(campaigns).toBeDefined();
    expect(Array.isArray(campaigns)).toBe(true);
    expect(campaigns.length).toBe(0);
  });

  for (const provenance of ['omitted', 'tampered']) {
    it(`POST /api/campaigns preserves stored creation provenance when ${provenance}`, async function () {
      const originalBody = cloneForCreate(initialObjectData);
      originalBody.stix.created = '2020-01-01T00:00:00.000Z';
      originalBody.stix.modified = originalBody.stix.created;
      const original = await request(app)
        .post('/api/campaigns')
        .send(originalBody)
        .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
        .expect(201);

      const revision = cloneForCreate(original.body);
      revision.stix.modified = '2020-02-01T00:00:00.000Z';
      revision.stix.description = 'An edited campaign.';
      if (provenance === 'omitted') {
        delete revision.stix.created;
        delete revision.stix.created_by_ref;
      } else {
        revision.stix.created = revision.stix.modified;
        revision.stix.created_by_ref = initialObjectData.stix.created_by_ref;
        expect(revision.stix.created_by_ref).not.toBe(original.body.stix.created_by_ref);
      }

      const saved = await request(app)
        .post('/api/campaigns')
        .send(revision)
        .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
        .expect(201);
      expect(saved.body.stix.created).toBe(original.body.stix.created);
      expect(saved.body.stix.created_by_ref).toBe(original.body.stix.created_by_ref);
      expect(saved.body.stix.modified).toBe(revision.stix.modified);
      expect(saved.body.stix.description).toBe(revision.stix.description);

      const persisted = await request(app)
        .get(`/api/campaigns/${saved.body.stix.id}/modified/${saved.body.stix.modified}`)
        .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
        .expect(200);
      expect(persisted.body.stix).toEqual(saved.body.stix);

      const historical = await request(app)
        .get(`/api/campaigns/${original.body.stix.id}/modified/${original.body.stix.modified}`)
        .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
        .expect(200);
      expect(historical.body.stix).toEqual(original.body.stix);
    });
  }

  for (const latestCreator of ['present', 'absent']) {
    it(`preserves imported latest provenance without recovery when creator is ${latestCreator}`, async function () {
      const original = await request(app)
        .post('/api/campaigns')
        .send({
          ...cloneForCreate(initialObjectData),
          stix: {
            ...initialObjectData.stix,
            created: '2020-01-01T00:00:00.000Z',
            modified: '2020-01-15T00:00:00.000Z',
          },
        })
        .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
        .expect(201);

      // Import may contain divergent provenance. Preserve it, without repairing history.
      const imported = {
        workspace: { workflow: { state: 'work-in-progress' } },
        stix: {
          ...original.body.stix,
          created: '2020-02-01T00:00:00.000Z',
          modified: '2020-03-01T00:00:00.000Z',
          aliases: ['Imported campaign alias'],
        },
      };
      if (latestCreator === 'present') {
        imported.stix.created_by_ref = initialObjectData.stix.created_by_ref;
      } else {
        delete imported.stix.created_by_ref;
      }
      await campaignsService.create(structuredClone(imported), {
        import: true,
        validateContents: true,
      });
      const importedRevision = await request(app)
        .get(`/api/campaigns/${imported.stix.id}/modified/${imported.stix.modified}`)
        .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
        .expect(200);
      expect(importedRevision.body.stix).toEqual(imported.stix);

      const track = await request(app)
        .post('/api/release-tracks/new')
        .send({ name: `Campaign provenance ${latestCreator}`, type: 'standard' })
        .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
        .expect(201);
      await request(app)
        .post(`/api/release-tracks/${track.body.id}/candidates`)
        .send({ object_refs: [{ id: imported.stix.id, modified: imported.stix.modified }] })
        .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
        .expect(200);

      // Clone latest authored content; the ordinary POST composes provenance.
      const revision = cloneForCreate(importedRevision.body);
      revision.stix.modified = '2020-04-01T00:00:00.000Z';
      revision.stix.created = original.body.stix.created;
      revision.stix.created_by_ref = original.body.stix.created_by_ref;
      const saved = await request(app)
        .post('/api/campaigns')
        .send(revision)
        .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
        .expect(201);
      expect(saved.body.stix.aliases).toEqual([imported.stix.name, ...imported.stix.aliases]);
      expect(saved.body.stix.created).toBe(imported.stix.created);
      expect(saved.body.stix.created_by_ref).toBe(imported.stix.created_by_ref);
      if (latestCreator === 'absent') {
        expect(saved.body.stix).not.toHaveProperty('created_by_ref');
      }
      expect(saved.body.stix.modified).toBe(revision.stix.modified);
      expect(saved.body.stix.x_mitre_modified_by_ref).toBe(
        original.body.stix.x_mitre_modified_by_ref,
      );

      const persisted = await request(app)
        .get(`/api/campaigns/${saved.body.stix.id}/modified/${saved.body.stix.modified}`)
        .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
        .expect(200);
      expect(persisted.body.stix).toEqual(saved.body.stix);
      const historical = await request(app)
        .get(`/api/campaigns/${original.body.stix.id}/modified/${original.body.stix.modified}`)
        .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
        .expect(200);
      expect(historical.body.stix).toEqual(original.body.stix);
      const intermediate = await request(app)
        .get(`/api/campaigns/${imported.stix.id}/modified/${imported.stix.modified}`)
        .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
        .expect(200);
      expect(intermediate.body.stix).toEqual(imported.stix);
      const history = await request(app)
        .get(`/api/campaigns/${imported.stix.id}?versions=all`)
        .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
        .expect(200);
      expect(history.body).toHaveLength(3);
      expect(saved.body.workspace.release_tracks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: track.body.id, tier: 'candidates' }),
        ]),
      );
      expect(
        (intermediate.body.workspace.release_tracks || []).map((entry) => entry.id),
      ).not.toContain(track.body.id);
    });
  }

  after(async function () {
    await database.closeConnection();
  });
});
