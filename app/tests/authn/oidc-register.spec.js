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

describe('OIDC User Account Registration', function () {
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

  const apiCookies = new Map();
  let redirectPath;
  const destination = `${localServerHost}:${localServerPort}/login-page`;
  it('GET /api/authn/oidc/login successfully receives a redirect to the identity provider', function (done) {
    const encodedDestination = encodeURIComponent(destination);
    request(app)
      .get(`/api/authn/oidc/login?destination=${encodedDestination}`)
      .expect(302)
      .end(function (err, res) {
        if (err) {
          done(err);
        } else {
          // Save the cookies for later tests
          const newCookies = setCookieParser(res);
          updateCookies(newCookies, apiCookies);

          // Get the redirect location
          redirectPath = res.headers.location;

          done();
        }
      });
  });

  let signInPath;
  const ipCookies = new Map();
  it('redirect successfully receives a challenge from the identity provider', function (done) {
    const url = new URL(redirectPath);
    const server = `${url.protocol}//${url.host}`;
    const path = url.pathname;
    const search = url.search;
    request(server)
      .get(path + search)
      .expect(200)
      .end(function (err, res) {
        if (err) {
          done(err);
        } else {
          // Save the cookies for later tests
          const newCookies = setCookieParser(res);
          updateCookies(newCookies, ipCookies);

          const action = extractFormAction(res.text);
          signInPath = action.value;

          done();
        }
      });
  });

  it('POST formpath successfully signs into the identity provider', function (done) {
    const signinUrl = new URL(signInPath);
    const server = `${signinUrl.protocol}//${signinUrl.host}`;
    const path = signinUrl.pathname;
    const search = signinUrl.search;
    request(server)
      .post(path + search)
      .set('Cookie', Array.from(ipCookies.values()))
      .send(`username=${testUser.username}`)
      .send(`password=${testUser.password}`)
      .send('credentialId=')
      .expect(302)
      .end(function (err, res) {
        if (err) {
          done(err);
        } else {
          // Get the redirect location
          redirectPath = res.headers.location;

          done();
        }
      });
  });

  it('redirect successfully completes the sign in process', function (done) {
    const url = new URL(redirectPath);
    const server = `${url.protocol}//${url.host}`;
    const path = url.pathname;
    const search = url.search;
    request(server)
      .get(path + search)
      .set('Cookie', Array.from(apiCookies.values()))
      .expect(302)
      .end(function (err, res) {
        if (err) {
          done(err);
        } else {
          // Session ID is changed after login, save the cookie for later tests
          const newCookies = setCookieParser(res);
          updateCookies(newCookies, apiCookies);

          // Get the redirect location
          redirectPath = res.headers.location;

          // This should be the destination provided at the start of the sign in process
          expect(redirectPath).toBe(destination);

          done();
        }
      });
  });

  it('GET /api/session returns the user session', function (done) {
    request(app)
      .get('/api/session')
      .set('Accept', 'application/json')
      .set('Cookie', Array.from(apiCookies.values()))
      .expect(200)
      .end(function (err, res) {
        if (err) {
          done(err);
        } else {
          // We expect to get the current session
          const session = res.body;
          expect(session).toBeDefined();
          expect(session.email).toBe(testUser.email);
          expect(session.registered).toBe(false);
          expect(session.name).toBe(testUser.username);
          expect(session.displayName).toBe(`${testUser.firstName} ${testUser.lastName}`);

          done();
        }
      });
  });

  let userAccount;
  it('POST /api/user-accounts/register successfully registers the user', function (done) {
    request(app)
      .post('/api/user-accounts/register')
      .set('Cookie', Array.from(apiCookies.values()))
      .expect(201)
      .end(function (err, res) {
        if (err) {
          done(err);
        } else {
          // We expect to get the new user account
          userAccount = res.body;
          expect(userAccount).toBeDefined();
          expect(userAccount.email).toBe(testUser.email);
          expect(userAccount.username).toBe(testUser.username);
          expect(userAccount.displayName).toBe(`${testUser.firstName} ${testUser.lastName}`);
          expect(userAccount.status).toBe('pending');
          expect(userAccount.role).toBe('none');

          done();
        }
      });
  });

  it('GET /api/session returns the user session', async function () {
    const res = await request(app)
      .get('/api/session')
      .set('Accept', 'application/json')
      .set('Cookie', Array.from(apiCookies.values()))
      .expect(200);

    // We expect to get the current session with a registered user
    const session = res.body;
    expect(session).toBeDefined();
    expect(session.email).toBe(testUser.email);
    expect(session.registered).toBe(true);
    expect(session.name).toBe(testUser.username);
    expect(session.displayName).toBe(`${testUser.firstName} ${testUser.lastName}`);
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

  it('GET /api/user-accounts/:id returns the added user account', async function () {
    const res = await request(app)
      .get('/api/user-accounts/' + userAccount.id)
      .set('Accept', 'application/json')
      .expect(200)
      .expect('Content-Type', /json/);

    // We expect to get one user account in an array
    const retrievedUserAccount = res.body;
    expect(retrievedUserAccount).toBeDefined();
    expect(retrievedUserAccount.id).toBe(userAccount.id);
    expect(retrievedUserAccount.email).toBe(userAccount.email);
    expect(retrievedUserAccount.username).toBe(userAccount.username);
    expect(retrievedUserAccount.displayName).toBe(userAccount.displayName);
    expect(retrievedUserAccount.status).toBe(userAccount.status);
    expect(retrievedUserAccount.role).toBe(userAccount.role);
  });

  it('POST /api/user-accounts/register does not register a user when logged out', async function () {
    await request(app)
      .post('/api/user-accounts/register')
      .set('Cookie', Array.from(apiCookies.values()))
      .expect(400);
  });

  after(async function () {
    await database.closeConnection();
    await server.close();
  });
});
