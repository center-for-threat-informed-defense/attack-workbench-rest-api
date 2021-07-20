const request = require('supertest');
const expect = require('expect');

const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');

const logger = require('../../../lib/logger');
logger.level = 'debug';

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

    it('GET /api/session', function (done) {
        request(app)
            .get('/api/session')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the current session
                    const session = res.body;
                    expect(session).toBeDefined();

                    done();
                }
            });
    });

    after(async function() {
        await database.closeConnection();
    });
});

