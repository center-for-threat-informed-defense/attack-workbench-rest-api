const request = require('supertest');
const expect = require('expect');
const _ = require('lodash');

const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');
const Campaign = require('../../../models/campaign-model');
const markingDefinitionService = require('../../../services/marking-definitions-service');
const systemConfigurationService = require('../../../services/system-configuration-service');

const config = require('../../../config/config');
const login = require('../../shared/login');

const logger = require('../../../lib/logger');
logger.level = 'debug';

// modified and created properties will be set before calling REST API
// stix.id property will be created by REST API
const initialObjectData = {
    workspace: {
        workflow: {
            state: 'work-in-progress'
        }
    },
    stix: {
        name: 'campaign-1',
        spec_version: '2.1',
        type: 'campaign',
        description: 'This is a marking definition. Blue.',
        aliases: [ 'campaign by another name' ],
        first_seen: '2016-04-06T00:00:00.000Z',
        created_by_ref: "identity--6444f546-6900-4456-b3b1-015c88d70dab"
    }
};

const markingDefinitionData = {
    workspace: {
        workflow: {
            state: 'reviewed'
        }
    },
    stix: {
        spec_version: '2.1',
        type: 'marking-definition',
        definition_type: 'statement',
        definition: { statement: 'This is a marking definition.' },
        created_by_ref: "identity--6444f546-6900-4456-b3b1-015c88d70dab"
    }
};

async function addDefaultMarkingDefinition(markingDefinitionData) {
    // Save the marking definition
    const timestamp = new Date().toISOString();
    markingDefinitionData.stix.created = timestamp;
    const savedMarkingDefinition = await markingDefinitionService.create(markingDefinitionData);

    // Get the current list of default marking definitions
    const defaultMarkingDefinitions = await systemConfigurationService.retrieveDefaultMarkingDefinitions({ refOnly: true });

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

    before(async function() {
        // Establish the database connection
        // Use an in-memory database that we spin up for the test
        await database.initializeConnection();

        // Wait until the indexes are created
        await Campaign.init();

        // Check for a valid database configuration
        await databaseConfiguration.checkSystemConfiguration();

        // Initialize the express app
        app = await require('../../../index').initializeApp();

        // Log into the app
        passportCookie = await login.loginAnonymous(app);

        defaultMarkingDefinition1 = await addDefaultMarkingDefinition(markingDefinitionData);
    });

    it('GET /api/campaigns returns an empty array of campaigns', function (done) {
        request(app)
            .get('/api/campaigns')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get an empty array
                    const campaigns = res.body;
                    expect(campaigns).toBeDefined();
                    expect(Array.isArray(campaigns)).toBe(true);
                    expect(campaigns.length).toBe(0);
                    done();
                }
            });
    });

    it('POST /api/campaigns does not create an empty campaign', function (done) {
        const body = { };
        request(app)
            .post('/api/campaigns')
            .send(body)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(400)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    done();
                }
            });
    });

    let campaign1;
    it('POST /api/campaigns creates a campaign', function (done) {
        const timestamp = new Date().toISOString();
        initialObjectData.stix.created = timestamp;
        initialObjectData.stix.modified = timestamp;
        const body = initialObjectData;
        request(app)
            .post('/api/campaigns')
            .send(body)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(201)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the created campaign
                    campaign1 = res.body;
                    expect(campaign1).toBeDefined();
                    expect(campaign1.stix).toBeDefined();
                    expect(campaign1.stix.id).toBeDefined();
                    expect(campaign1.stix.created).toBeDefined();
                    expect(campaign1.stix.modified).toBeDefined();
                    expect(campaign1.stix.first_seen).toBeDefined();
                    expect(campaign1.stix.x_mitre_attack_spec_version).toBe(config.app.attackSpecVersion);

                    expect(campaign1.stix.aliases).toBeDefined();
                    expect(Array.isArray(campaign1.stix.aliases)).toBe(true);
                    expect(campaign1.stix.aliases.length).toBe(1);

                    expect(campaign1.stix.last_seen).toBeUndefined();

                    // object_marking_refs should contain the default marking definition
                    expect(campaign1.stix.object_marking_refs).toBeDefined();
                    expect(Array.isArray(campaign1.stix.object_marking_refs)).toBe(true);
                    expect(campaign1.stix.object_marking_refs.length).toBe(1);
                    expect(campaign1.stix.object_marking_refs[0]).toBe(defaultMarkingDefinition1.stix.id);

                    done();
                }
            });
    });

    it('GET /api/campaigns returns the added campaign', function (done) {
        request(app)
            .get('/api/campaigns')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one campaign in an array
                    const campaigns = res.body;
                    expect(campaigns).toBeDefined();
                    expect(Array.isArray(campaigns)).toBe(true);
                    expect(campaigns.length).toBe(1);
                    done();
                }
            });
    });

    it('GET /api/campaigns/:id should not return a campaign when the id cannot be found', function (done) {
        request(app)
            .get('/api/campaigns/not-an-id')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(404)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    done();
                }
            });
    });

    it('GET /api/campaigns/:id returns the added campaign', function (done) {
        request(app)
            .get('/api/campaigns/' + campaign1.stix.id)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
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
                    expect(campaign.stix.object_marking_refs).toEqual(expect.arrayContaining(campaign1.stix.object_marking_refs));
                    expect(campaign.stix.created_by_ref).toBe(campaign1.stix.created_by_ref);
                    expect(campaign.stix.x_mitre_attack_spec_version).toBe(campaign1.stix.x_mitre_attack_spec_version);

                    done();
                }
            });
    });

    it('PUT /api/campaigns updates a campaign', function (done) {
        const originalModified = campaign1.stix.modified;
        const timestamp = new Date().toISOString();
        campaign1.stix.modified = timestamp;
        campaign1.stix.description = 'This is an updated campaign. Blue.'
        const body = campaign1;
        request(app)
            .put('/api/campaigns/' + campaign1.stix.id + '/modified/' + originalModified)
            .send(body)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the updated campaign
                    const campaign = res.body;
                    expect(campaign).toBeDefined();
                    expect(campaign.stix.id).toBe(campaign1.stix.id);
                    expect(campaign.stix.modified).toBe(campaign1.stix.modified);
                    done();
                }
            });
    });

    it('POST /api/campaigns does not create a campaign with the same id and modified date', function (done) {
        const body = campaign1;
        request(app)
            .post('/api/campaigns')
            .send(body)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(409)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    done();
                }
            });
    });

    let campaign2;
    it('POST /api/campaigns should create a new version of a campaign with a duplicate stix.id but different stix.modified date', async function () {
        // Add another default marking definition
        markingDefinitionData.stix.definition = 'This is the second default marking definition';
        defaultMarkingDefinition2 = await addDefaultMarkingDefinition(markingDefinitionData);

        campaign2 = _.cloneDeep(campaign1);
        campaign2._id = undefined;
        campaign2.__t = undefined;
        campaign2.__v = undefined;
        const timestamp = new Date().toISOString();
        campaign2.stix.modified = timestamp;
        campaign2.stix.description = 'This is a new version of a campaign. Green.';

        const body = campaign2;
        const res = await request(app)
            .post('/api/campaigns')
            .send(body)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(201)
            .expect('Content-Type', /json/);

        // We expect to get the created campaign
        const campaign = res.body;
        expect(campaign).toBeDefined();
    });

    it('GET /api/campaigns returns the latest added campaign', function (done) {
        request(app)
            .get('/api/campaigns/' + campaign2.stix.id)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
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
                    expect(campaign.stix.object_marking_refs.includes(defaultMarkingDefinition1.stix.id)).toBe(true);
                    expect(campaign.stix.object_marking_refs.includes(defaultMarkingDefinition2.stix.id)).toBe(true);

                    done();
                }
            });
    });

    it('GET /api/campaigns returns all added campaigns', function (done) {
        request(app)
            .get('/api/campaigns/' + campaign1.stix.id + '?versions=all')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get two campaigns in an array
                    const campaigns = res.body;
                    expect(campaigns).toBeDefined();
                    expect(Array.isArray(campaigns)).toBe(true);
                    expect(campaigns.length).toBe(2);
                    done();
                }
            });
    });

    it('GET /api/campaigns/:id/modified/:modified returns the first added campaign', function (done) {
        request(app)
            .get('/api/campaigns/' + campaign1.stix.id + '/modified/' + campaign1.stix.modified)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one campaign
                    const campaign = res.body;
                    expect(campaign).toBeDefined();
                    expect(campaign.stix).toBeDefined();
                    expect(campaign.stix.id).toBe(campaign1.stix.id);
                    expect(campaign.stix.modified).toBe(campaign1.stix.modified);
                    done();
                }
            });
    });

    it('GET /api/campaigns/:id/modified/:modified returns the second added campaign', function (done) {
        request(app)
            .get('/api/campaigns/' + campaign2.stix.id + '/modified/' + campaign2.stix.modified)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one campaign
                    const campaign = res.body;
                    expect(campaign).toBeDefined();
                    expect(campaign.stix).toBeDefined();
                    expect(campaign.stix.id).toBe(campaign2.stix.id);
                    expect(campaign.stix.modified).toBe(campaign2.stix.modified);
                    done();
                }
            });
    });

    let campaign3;
    it('POST /api/campaigns should create a new campaign with a different stix.id', function (done) {
        const campaign = _.cloneDeep(initialObjectData);
        campaign._id = undefined;
        campaign.__t = undefined;
        campaign.__v = undefined;
        campaign.stix.id = undefined;
        const timestamp = new Date().toISOString();
        campaign.stix.created = timestamp;
        campaign.stix.modified = timestamp;
        campaign.stix.name = 'Mr. Brown';
        campaign.stix.description = 'This is a new campaign. Red.';
        const body = campaign;
        request(app)
            .post('/api/campaigns')
            .send(body)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(201)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the created campaign
                    campaign3 = res.body;
                    expect(campaign3).toBeDefined();
                    done();
                }
            });
    });

    it('GET /api/campaigns uses the search parameter to return the latest version of the campaign', function (done) {
        request(app)
            .get('/api/campaigns?search=green')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
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
                    done();
                }
            });
    });

    it('GET /api/campaigns should not get the first version of the campaign when using the search parameter', function (done) {
        request(app)
            .get('/api/campaigns?search=blue')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get zero campaigns in an array
                    const campaigns = res.body;
                    expect(campaigns).toBeDefined();
                    expect(Array.isArray(campaigns)).toBe(true);
                    expect(campaigns.length).toBe(0);
                    done();
                }
            });
    });

    it('GET /api/campaigns uses the search parameter to return the campaign using the name property', function (done) {
        request(app)
            .get('/api/campaigns?search=brown')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
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
                    done();
                }
            });
    });

    it('DELETE /api/campaigns deletes a campaign', function (done) {
        request(app)
            .delete('/api/campaigns/' + campaign1.stix.id + '/modified/' + campaign1.stix.modified)
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(204)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    done();
                }
            });
    });

    it('DELETE /api/campaigns should delete the second campaign', function (done) {
        request(app)
            .delete('/api/campaigns/' + campaign2.stix.id + '/modified/' + campaign2.stix.modified)
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(204)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    done();
                }
            });
    });

    it('DELETE /api/campaigns should delete the third campaign', function (done) {
        request(app)
            .delete('/api/campaigns/' + campaign3.stix.id + '/modified/' + campaign3.stix.modified)
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(204)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    done();
                }
            });
    });

    it('GET /api/campaigns returns an empty array of campaigns', function (done) {
        request(app)
            .get('/api/campaigns')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get an empty array
                    const campaigns = res.body;
                    expect(campaigns).toBeDefined();
                    expect(Array.isArray(campaigns)).toBe(true);
                    expect(campaigns.length).toBe(0);
                    done();
                }
            });
    });

    after(async function() {
        await database.closeConnection();
    });
});

