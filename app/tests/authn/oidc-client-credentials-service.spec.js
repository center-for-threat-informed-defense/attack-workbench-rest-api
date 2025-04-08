const request = require('supertest');
const { expect } = require('expect');

// Tell config to read from a config file
process.env.JSON_CONFIG_PATH = './app/tests/authn/oidc-client-credentials-service-account.json';

const database = require('../../lib/database-in-memory');
const databaseConfiguration = require('../../lib/database-configuration');

const logger = require('../../lib/logger');
const keycloak = require('../shared/keycloak');
const config = require('../../config/config');
logger.level = 'debug';

const oidcHost = 'localhost:8080';
const oidcRealm = 'test-oidc-realm';

const oidcRestApiClientId = 'attack-workbench-rest-api';
const oidcRestApiClientSecret = 'a58c55d9-8408-45de-a9ef-a55b433291de';

const oidcServiceClientId = 'oidc-test-service';
const oidcServiceClientSecret = '774ca536-b281-4783-bfed-cc362c39405b';

const localServerHost = 'localhost';
const localServerPort = 3000;
const localServerRedirectUrl = `http://${localServerHost}:${localServerPort}/api/authn/oidc/*`;
const jwksUri = `http://${oidcHost}/realms/${oidcRealm}/protocol/openid-connect/certs`;

describe('Client Credentials Service Authentication', function () {
  let app;
  let accessToken;

  before(async function () {
    // Configure the test to use anonymous authentication
    process.env.AUTHN_MECHANISM = 'anonymous';
    process.env.JWKS_URI = jwksUri;

    config.reloadConfig();

    // Establish the database connection
    // Use an in-memory database that we spin up for the test
    await database.initializeConnection();

    // Check for a valid database configuration
    await databaseConfiguration.checkSystemConfiguration();

    // Initialize the OIDC server
    const options = {
      basePath: oidcHost,
      realmName: oidcRealm,
      clientId: oidcRestApiClientId,
      description: 'client',
      standardFlowEnabled: true,
      redirectUris: [localServerRedirectUrl],
      clientSecret: oidcRestApiClientSecret,
    };
    await keycloak.initializeKeycloak(options);

    const clientOptions = {
      basePath: oidcHost,
      realmName: oidcRealm,
      clientId: oidcServiceClientId,
      description: 'client',
      clientSecret: oidcServiceClientSecret,
      standardFlowEnabled: false,
      serviceAccountsEnabled: true,
    };
    await keycloak.addClientToKeycloak(clientOptions);

    accessToken = await keycloak.getAccessTokenToClient(clientOptions);

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

  it('GET /api/session returns the session when called with a valid token', async function () {
    const res = await request(app)
      .get('/api/session')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // We expect to get the current session
    const session = res.body;
    expect(session).toBeDefined();
    expect(session.clientId).toBe(oidcServiceClientId);
  });

  after(async function () {
    await database.closeConnection();
  });
});
