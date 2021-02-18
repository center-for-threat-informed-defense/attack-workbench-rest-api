const request = require('supertest');
const database = require('../../../lib/database-in-memory')
const expect = require('expect');

const logger = require('../../../lib/logger');
logger.level = 'debug';

describe('System Configuration API', function () {
    let app;

    before(async function() {
        // Initialize the express app
        app = await require('../../../index').initializeApp();

        // Establish the database connection
        // Use an in-memory database that we spin up for the test
        await database.initializeConnection();
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
                    const expectedPropertyName = 'x_mitre_platform';
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

    after(async function() {
        await database.closeConnection();
    });
});

