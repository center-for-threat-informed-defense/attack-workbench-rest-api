const request = require('supertest');
const { expect } = require('expect');

// Tell config to read from a config file
process.env.JSON_CONFIG_PATH = './app/tests/authn/basic-apikey-service-account.json';

const database = require('../../lib/database-in-memory');
const databaseConfiguration = require('../../lib/database-configuration');

const apikey = 'xyzzy';
const serviceName = 'apikey-test-service';

const logger = require('../../lib/logger');
logger.level = 'debug';

describe('Basic Apikey Service Authentication', function () {
  let app;

  before(async function () {
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

  it('GET /api/session returns not authorized when called without apikey', function (done) {
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

  it('GET /api/session returns bad request with an invalid apikey', function (done) {
    request(app)
      .get('/api/session')
      .set('Accept', 'application/json')
      .set('Authorization', `Basic abcd`)
      .expect(400)
      .end(function (err, res) {
        if (err) {
          done(err);
        } else {
          done();
        }
      });
  });

  it('GET /api/session returns not authorized with an incorrect apikey', function (done) {
    const encodedApikey = Buffer.from(`${serviceName}:abcd`).toString('base64');
    request(app)
      .get('/api/session')
      .set('Accept', 'application/json')
      .set('Authorization', `Basic ${encodedApikey}`)
      .expect(401)
      .end(function (err, res) {
        if (err) {
          done(err);
        } else {
          done();
        }
      });
  });

  it('GET /api/session returns the session', function (done) {
    const encodedApikey = Buffer.from(`${serviceName}:${apikey}`).toString('base64');
    request(app)
      .get('/api/session')
      .set('Accept', 'application/json')
      .set('Authorization', `Basic ${encodedApikey}`)
      .expect(200)
      .end(function (err, res) {
        if (err) {
          done(err);
        } else {
          // We expect to get the current session
          const session = res.body;
          expect(session).toBeDefined();
          expect(session.serviceName).toBe(serviceName);

          done();
        }
      });
  });

  after(async function () {
    await database.closeConnection();
  });
});
