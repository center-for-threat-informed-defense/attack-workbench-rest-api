const request = require('supertest');
const expect = require('expect');

const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');

const logger = require('../../../lib/logger');
logger.level = 'debug';

const amberStixId = 'marking-definition--f88d31f6-486f-44da-b317-01333bde0b82';

const markingDefinitionData = {
    workspace: {
        workflow: {
            state: 'work-in-progress'
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

describe('System Configuration API', function () {
    let app;

    before(async function() {
        // Establish the database connection
        // Use an in-memory database that we spin up for the test
        await database.initializeConnection();

        // Check for a valid database configuration
        await databaseConfiguration.checkSystemConfiguration();

        // Initialize the express app
        app = await require('../../../index').initializeApp();
    });

    it('GET /api/config/system-version returns the system version info', function (done) {
        request(app)
            .get('/api/config/system-version')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the system version info
                    const systemVersionInfo = res.body;
                    expect(systemVersionInfo).toBeDefined();
                    expect(systemVersionInfo.version).toBeDefined();
                    expect(systemVersionInfo.attackSpecVersion).toBeDefined();

                    done();
                }
            });
    });

    it('GET /api/config/allowed-values returns the allowed values', function (done) {
        request(app)
            .get('/api/config/allowed-values')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the list of allowed values
                    const allowedValues = res.body;
                    expect(allowedValues).toBeDefined();
                    expect(Array.isArray(allowedValues)).toBe(true);

                    const expectedObjectType = 'technique';
                    const expectedPropertyName = 'x_mitre_platforms';
                    const expectedDomainName = 'enterprise-attack';
                    const expectedPropertyValue = 'Linux';

                    // Test some content
                    const techniqueAllowedValues = allowedValues.find(item => item.objectType === expectedObjectType);
                    expect(techniqueAllowedValues).toBeDefined();

                    const propertyAllowedValues = techniqueAllowedValues.properties.find(item => item.propertyName === expectedPropertyName);
                    expect(propertyAllowedValues).toBeDefined();

                    const domainAllowedValues = propertyAllowedValues.domains.find(item => item.domainName === expectedDomainName);
                    expect(domainAllowedValues).toBeDefined();
                    expect(domainAllowedValues.allowedValues).toContain(expectedPropertyValue);

                    done();
                }
            });
    });

    it('GET /api/config/organization-identity returns the organizaton identity', function (done) {
        request(app)
            .get('/api/config/organization-identity')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the organization identity
                    const identity = res.body;
                    expect(identity).toBeDefined();

                    done();
                }
            });
    });

    it('GET /api/config/authn returns the available authentication mechanisms', function (done) {
        request(app)
            .get('/api/config/authn')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the list of authentication mechanisms
                    const authnConfig = res.body;
                    expect(authnConfig).toBeDefined();
                    expect(authnConfig.mechanisms).toBeDefined();
                    expect(Array.isArray(authnConfig.mechanisms)).toBe(true);
                    done();
                }
            });
    });

    let amberTlpMarkingDefinition;
    it('GET /api/marking-definitions returns the static TLP marking definitions', function (done) {
        request(app)
            .get('/api/marking-definitions')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the pre-defined TLP marking definitions
                    const markingDefinitions = res.body;
                    expect(markingDefinitions).toBeDefined();
                    expect(Array.isArray(markingDefinitions)).toBe(true)
                    expect(markingDefinitions.length).toBe(4);

                    amberTlpMarkingDefinition = markingDefinitions.find(x => x.stix.id === amberStixId);
                    expect(amberTlpMarkingDefinition).toBeDefined();

                    done();
                }
            });
    });


    it('PUT /api/marking-definitions fails to update a static marking definition', function (done) {
        amberTlpMarkingDefinition.stix.description = 'This is an updated marking definition.'
        const body = amberTlpMarkingDefinition;
        request(app)
            .put('/api/marking-definitions/' + amberTlpMarkingDefinition.stix.id)
            .send(body)
            .set('Accept', 'application/json')
            .expect(400)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    done();
                }
            });
    });

    it('GET /api/config/default-marking-definitions returns an empty array since no default has been set', function (done) {
        request(app)
            .get('/api/config/default-marking-definitions')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get an empty array
                    const defaultMarkingDefinitions = res.body;
                    expect(defaultMarkingDefinitions).toBeDefined();
                    expect(Array.isArray(defaultMarkingDefinitions)).toBe(true)
                    expect(defaultMarkingDefinitions.length).toBe(0);

                    done();
                }
            });
    });

    let markingDefinition;
    it('POST /api/marking-definitions creates a marking definition', function (done) {
        const timestamp = new Date().toISOString();
        markingDefinitionData.stix.created = timestamp;
        const body = markingDefinitionData;
        request(app)
            .post('/api/marking-definitions')
            .send(body)
            .set('Accept', 'application/json')
            .expect(201)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the created marking definition
                    markingDefinition = res.body;
                    expect(markingDefinition).toBeDefined();

                    done();
                }
            });
    });

    it('POST /api/config/default-marking-definitions sets the default marking definitions', function (done) {
        const body = [ markingDefinition.stix.id ];
        request(app)
            .post('/api/config/default-marking-definitions')
            .send(body)
            .set('Accept', 'application/json')
            .expect(204)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect the response body to be empty
                    done();
                }
            });
    });

    it('GET /api/config/default-marking-definitions returns an array containing the marking definition', function (done) {
        request(app)
            .get('/api/config/default-marking-definitions')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get an empty array
                    const defaultMarkingDefinitions = res.body;
                    expect(defaultMarkingDefinitions).toBeDefined();
                    expect(Array.isArray(defaultMarkingDefinitions)).toBe(true)
                    expect(defaultMarkingDefinitions.length).toBe(1);
                    expect(defaultMarkingDefinitions[0].stix.id).toBe(markingDefinition.stix.id);
                    done();
                }
            });
    });

    it('GET /api/config/organization-namespace returns the default namespace', function (done) {
        request(app)
            .get('/api/config/organization-namespace')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the default namespace
                    const namespace = res.body;
                    expect(namespace).toBeDefined();
                    expect(namespace.range_start).toBeNull();
                    expect(namespace.prefix).toBeNull();

                    done();
                }
            });
    });

    const testNamespace = {  range_start: 3000, prefix: 'TESTORG' };
    it('POST /api/config/organization-namespace sets the organization namespace', function (done) {
        const body = testNamespace;
        request(app)
            .post('/api/config/organization-namespace')
            .send(body)
            .set('Accept', 'application/json')
            .expect(204)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect the response body to be empty
                    done();
                }
            });
    });

    it('GET /api/config/organization-namespace returns the updated namespace', function (done) {
        request(app)
            .get('/api/config/organization-namespace')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the default namespace
                    const namespace = res.body;
                    expect(namespace).toBeDefined();
                    expect(namespace.range_start).toBe(testNamespace.range_start);
                    expect(namespace.prefix).toBe(testNamespace.prefix);

                    done();
                }
            });
    });

    after(async function() {
        await database.closeConnection();
    });
});

