const request = require('supertest');
const { expect } = require('expect');
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

  it('GET /api/session returns not authorized when called without token', async function () {
    await request(app).get('/api/session').set('Accept', 'application/json').expect(401);
  });

  it('GET /api/session returns not authorized with an invalid token', async function () {
    await request(app)
      .get('/api/session')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer abcd`)
      .expect(401);
  });

  it('GET /api/authn/service/apikey-challenge fails with an unknown service name', async function () {
    await request(app)
      .get(`/api/authn/service/apikey-challenge?serviceName=notaservice`)
      .set('Accept', 'application/json')
      .expect(404);
  });

  let challengeString;
  it('GET /api/authn/service/apikey-challenge successfully retrieves the challenge string', async function () {
    const res = await request(app)
      .get(`/api/authn/service/apikey-challenge?serviceName=${serviceName}`)
      .set('Accept', 'application/json')
      .expect(200);

    const data = res.body;
    expect(data).toBeDefined();
    expect(data.challenge).toBeDefined();

    challengeString = data.challenge;
  });

  it('GET /api/authn/service/apikey-token fails with a bad challenge hash', async function () {
    const hmac = crypto.createHmac('sha256', 'not the apikey');
    hmac.update(challengeString);
    const challengeHash = hmac.digest('hex');
    await request(app)
      .get(`/api/authn/service/apikey-token?serviceName=${serviceName}`)
      .set('Accept', 'application/json')
      .set('Authorization', `Apikey ${challengeHash}`)
      .expect(400);
  });

  // Get another challenge. The failed challenge hash uses the previously retrieved challenge.
  it('GET /api/authn/service/apikey-challenge successfully retrieves a second challenge string', async function () {
    const res = await request(app)
      .get(`/api/authn/service/apikey-challenge?serviceName=${serviceName}`)
      .set('Accept', 'application/json')
      .expect(200);

    const data = res.body;
    expect(data).toBeDefined();
    expect(data.challenge).toBeDefined();

    challengeString = data.challenge;
  });

  let token;
  it('GET /api/authn/service/apikey-token returns the access token', async function () {
    const hmac = crypto.createHmac('sha256', apikey);
    hmac.update(challengeString);
    const challengeHash = hmac.digest('hex');
    const res = await request(app)
      .get(`/api/authn/service/apikey-token?serviceName=${serviceName}`)
      .set('Accept', 'application/json')
      .set('Authorization', `Apikey ${challengeHash}`)
      .expect(200);

    // We expect to get the current session
    const data = res.body;
    expect(data).toBeDefined();
    expect(data.access_token).toBeDefined();

    token = data.access_token;
  });

  it('GET /api/session returns the session', async function () {
    const res = await request(app)
      .get('/api/session')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    // We expect to get the current session
    const session = res.body;
    expect(session).toBeDefined();
    expect(session.serviceName).toBe(serviceName);
  });

  after(async function () {
    await database.closeConnection();
  });
});
