const request = require('supertest');
const { expect } = require('expect');
const setCookieParser = require('set-cookie-parser');
const libCookie = require('cookie');
const parse5 = require('parse5');
const parse5Query = require('parse5-query-domtree');

const config = require('../../config/config');

const database = require('../../lib/database-in-memory');
const databaseConfiguration = require('../../lib/database-configuration');

const keycloak = require('../shared/keycloak');

const logger = require('../../lib/logger');
logger.level = 'debug';

const oidcHost = 'localhost:8080';
const oidcRealm = 'test-oidc-realm';
const oidcClientId = 'attack-workbench-rest-api';
const oidcClientSecret = 'a58c55d9-8408-45de-a9ef-a55b433291de';

const localServerHost = 'localhost';
const localServerPort = 3000;
const localServerRedirectUrl = `http://${localServerHost}:${localServerPort}/api/authn/oidc/*`;

// Keycloak stores firstName and lastName separately, but combines them to make the name claim
const testUser = {
  email: 'test@test.com',
  username: 'test@test.com',
  password: 'testuser',
  firstName: 'Test',
  lastName: 'User',
};

function extractFormAction(html) {
  const documentRoot = parse5.parse(html);
  const formElement = parse5Query.queryOne(documentRoot).getElementsByTagName('form');
  if (formElement) {
    const action = formElement.attrs.find((e) => e.name === 'action');
    return action;
  } else {
    return null;
  }
}

let server;

function startServer(app, port) {
  server = app.listen(port, function () {
    const host = server.address().address;
    const port = server.address().port;

    logger.info(`Listening at http://${host}:${port}`);
  });
}

function updateCookies(newCookies, cookieMap) {
  for (const cookie of newCookies) {
    const headerString = libCookie.serialize(cookie.name, cookie.value, cookie);
    cookieMap.set(cookie.name, headerString);
  }
}

describe('OIDC User Authentication', function () {
  let app;

  before(async function () {
    // Configure the test to use OIDC authentication
    process.env.AUTHN_MECHANISM = 'oidc';
    process.env.AUTHN_OIDC_ISSUER_URL = `http://${oidcHost}/realms/${oidcRealm}/.well-known/openid-configuration`;
    process.env.AUTHN_OIDC_CLIENT_ID = oidcClientId;

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
      clientId: oidcClientId,
      description: 'client',
      standardFlowEnabled: true,
      redirectUris: [localServerRedirectUrl],
      clientSecret: oidcClientSecret,
    };
    const clientCredentials = await keycloak.initializeKeycloak(options);
    config.userAuthn.oidc.clientSecret = clientCredentials.value;

    // Add a test user
    await keycloak.addUsersToKeycloak(options, testUser);

    // Initialize the express app
    app = await require('../../index').initializeApp();

    // Open a port to receive redirects from the identity provider
    startServer(app, localServerPort);
  });

  it('GET /api/session returns not authorized (before logging in)', async function () {
    await request(app).get('/api/session').set('Accept', 'application/json').expect(401);
  });

  const apiCookies = new Map();
  let redirectPath;
  const destination = `${localServerHost}:${localServerPort}/login-page`;
  it('GET /api/authn/oidc/login successfully receives a redirect to the identity provider', async function () {
    const encodedDestination = encodeURIComponent(destination);
    const res = await request(app)
      .get(`/api/authn/oidc/login?destination=${encodedDestination}`)
      .expect(302);
    // Save the cookies for later tests
    const newCookies = setCookieParser(res);
    updateCookies(newCookies, apiCookies);

    // Get the redirect location
    redirectPath = res.headers.location;
  });

  let signInPath;
  const ipCookies = new Map();
  it('redirect successfully receives a challenge from the identity provider', async function () {
    const url = new URL(redirectPath);
    const server = `${url.protocol}//${url.host}`;
    const path = url.pathname;
    const search = url.search;

    const res = await request(server)
      .get(path + search)
      .expect(200);

    // Save the cookies for later tests
    const newCookies = setCookieParser(res);
    updateCookies(newCookies, ipCookies);

    const action = extractFormAction(res.text);
    signInPath = action.value;
  });

  it('POST formpath successfully signs into the identity provider', async function () {
    const signinUrl = new URL(signInPath);
    const server = `${signinUrl.protocol}//${signinUrl.host}`;
    const path = signinUrl.pathname;
    const search = signinUrl.search;

    const res = await request(server)
      .post(path + search)
      .set('Cookie', Array.from(ipCookies.values()))
      .send(`username=${testUser.username}`)
      .send(`password=${testUser.password}`)
      .send('credentialId=')
      .expect(302);

    // Get the redirect location
    redirectPath = res.headers.location;
  });

  it('redirect successfully completes the sign in process', async function () {
    const url = new URL(redirectPath);
    const server = `${url.protocol}//${url.host}`;
    const path = url.pathname;
    const search = url.search;

    const res = await request(server)
      .get(path + search)
      .set('Cookie', Array.from(apiCookies.values()))
      .expect(302);

    // Session ID is changed after login, save the cookie for later tests
    const newCookies = setCookieParser(res);
    updateCookies(newCookies, apiCookies);

    // Get the redirect location
    redirectPath = res.headers.location;

    // This should be the destination provided at the start of the sign in process
    expect(redirectPath).toBe(destination);
  });

  it('GET /api/session returns the user session', async function () {
    const res = await request(app)
      .get('/api/session')
      .set('Accept', 'application/json')
      .set('Cookie', Array.from(apiCookies.values()))
      .expect(200);

    // We expect to get the current session
    const session = res.body;
    expect(session).toBeDefined();
    expect(session.email).toBe('test@test.com');
  });

  it('GET /api/authn/oidc/logout successfully logs the user out', async function () {
    await request(app)
      .get('/api/authn/oidc/logout')
      .set('Accept', 'application/json')
      .set('Cookie', Array.from(apiCookies.values()))
      .expect(200);
  });

  it('GET /api/session returns not authorized (after logging out)', async function () {
    await request(app)
      .get('/api/session')
      .set('Accept', 'application/json')
      .set('Cookie', Array.from(apiCookies.values()))
      .expect(401);
  });

  it('GET /api/authn/anonymous/login cannot log in using incorrect authentication mechanism', async function () {
    await request(app)
      .get('/api/authn/anonymous/login')
      .set('Accept', 'application/json')
      .expect(404);
  });

  it('GET /api/authn/anonymous/logout cannot log out using incorrect authentication mechanism', async function () {
    await request(app)
      .get('/api/authn/anonymous/logout')
      .set('Accept', 'application/json')
      .expect(404);
  });

  after(async function () {
    await database.closeConnection();
    await server.close();
  });
});
