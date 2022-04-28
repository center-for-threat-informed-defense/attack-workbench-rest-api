const request = require('supertest');
const expect = require('expect');
const crypto = require('crypto');

// Tell config to read from a config file
process.env.JSON_CONFIG_PATH = './app/tests/authn/challenge-apikey-service-account.json';

const database = require('../../lib/database-in-memory');
const databaseConfiguration = require('../../lib/database-configuration');

const apikey = 'xyzzy';
const serviceName = 'apikey-test-service';

const logger = require('../../lib/logger');
logger.level = 'debug';

describe('Challenge Apikey Service Authentication', function () {
    let app;

    before(async function() {
        // Configure the test to use anonymous authentication
        process.env.AUTHN_MECHANISM = 'anonymous';

        // Establish the database connection
        // Use an in-memory database that we spin up for the test
        await database.initializeConnection();

        // Check for a valid database configuration
        await databaseConfiguration.checkSystemConfiguration();

        // Initialize the express app
        app = await require('../../index').initializeApp();
    });

    it('GET /api/session returns not authorized when called without token', function (done) {
        request(app)
            .get('/api/session')
            .set('Accept', 'application/json')
            .expect(401)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    done();
                }
            });
    });

    it('GET /api/session returns not authorized with an invalid token', function (done) {
        request(app)
            .get('/api/session')
            .set('Accept', 'application/json')
            .set('Authorization', `Bearer abcd`)
            .expect(401)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    done();
                }
            });
    });

    it('GET /api/authn/service/apikey-challenge fails with an unknown service name', function (done) {
        request(app)
            .get(`/api/authn/service/apikey-challenge?serviceName=notaservice`)
            .set('Accept', 'application/json')
            .expect(404)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    done();
                }
            });
    });

    let challengeString;
    it('GET /api/authn/service/apikey-challenge successfully retrieves the challenge string', function (done) {
        request(app)
            .get(`/api/authn/service/apikey-challenge?serviceName=${ serviceName }`)
            .set('Accept', 'application/json')
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    const data = res.body;
                    expect(data).toBeDefined();
                    expect(data.challenge).toBeDefined();

                    challengeString = data.challenge;

                    done();
                }
            });
    });

    it('GET /api/authn/service/apikey-token fails with a bad challenge hash', function (done) {
        const hmac = crypto.createHmac('sha256', 'not the apikey');
        hmac.update(challengeString);
        const challengeHash = hmac.digest('hex');
        request(app)
            .get(`/api/authn/service/apikey-token?serviceName=${ serviceName }`)
            .set('Accept', 'application/json')
            .set('Authorization', `Apikey ${ challengeHash }`)
            .expect(400)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    done();
                }
            });
    });

    // Get another challenge. The failed challenge hash uses the previously retrieved challenge.
    it('GET /api/authn/service/apikey-challenge successfully retrieves a second challenge string', function (done) {
        request(app)
            .get(`/api/authn/service/apikey-challenge?serviceName=${ serviceName }`)
            .set('Accept', 'application/json')
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    const data = res.body;
                    expect(data).toBeDefined();
                    expect(data.challenge).toBeDefined();

                    challengeString = data.challenge;

                    done();
                }
            });
    });

    let token;
    it('GET /api/authn/service/apikey-token returns the access token', function (done) {
        const hmac = crypto.createHmac('sha256', apikey);
        hmac.update(challengeString);
        const challengeHash = hmac.digest('hex');
        request(app)
            .get(`/api/authn/service/apikey-token?serviceName=${ serviceName }`)
            .set('Accept', 'application/json')
            .set('Authorization', `Apikey ${ challengeHash }`)
            .expect(200)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the current session
                    const data = res.body;
                    expect(data).toBeDefined();
                    expect(data.access_token).toBeDefined();

                    token = data.access_token;

                    done();
                }
            });
    });

    it('GET /api/session returns the session', function (done) {
        request(app)
            .get('/api/session')
            .set('Accept', 'application/json')
            .set('Authorization', `Bearer ${ token }`)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the current session
                    const session = res.body;
                    expect(session).toBeDefined();
                    expect(session.serviceName).toBe(serviceName);

                    done();
                }
            });
    });

    after(async function() {
        await database.closeConnection();
    });
});

