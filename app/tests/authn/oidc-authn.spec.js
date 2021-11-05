const request = require('supertest');
const expect = require('expect');
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
const oidcClientId = 'attack-workbench-test';
const oidcClientSecret = 'a58c55d9-8408-45de-a9ef-a55b433291de';

const localServerHost = 'localhost';
const localServerPort = 3000;

function extractFormAction(html) {
    const documentRoot = parse5.parse(html);
    const formElement = parse5Query.queryOne(documentRoot).getElementsByTagName('form');
    if (formElement) {
        const action = formElement.attrs.find(e => e.name === 'action');
        return action;
    }
    else {
        return null;
    }
}

let server;

function startServer(app, port) {
    server = app.listen(port, function () {
        const host = server.address().address;
        const port = server.address().port;

        logger.info(`Listening at http://${host}:${port}`);
    })
}

describe('OIDC Authentication', function () {
    let app;

    before(async function() {
        // Configure the test to use OIDC authentication
        process.env.AUTHN_MECHANISM = 'oidc';
        process.env.AUTHN_OIDC_ISSUER_URL = `http://${ oidcHost }/auth/realms/${ oidcRealm }/.well-known/openid-configuration`;
        process.env.AUTHN_OIDC_CLIENT_ID = oidcClientId;

        config.reloadConfig();

        // Establish the database connection
        // Use an in-memory database that we spin up for the test
        await database.initializeConnection();

        // Check for a valid database configuration
        await databaseConfiguration.checkSystemConfiguration();

        // Initialize the OIDC server
        const clientCredentials = await keycloak.initializeKeycloak(oidcHost, oidcRealm, oidcClientId, oidcClientSecret);
        // eslint-disable-next-line require-atomic-updates
        config.authn.oidc.clientSecret = clientCredentials.value;

        // Initialize the express app
        app = await require('../../index').initializeApp();

        // Open a port to receive redirects from the identity provider
        startServer(app, localServerPort);
    });

    it('GET /api/session returns not authorized (before logging in)', function (done) {
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

    const apiCookies = [];
    let redirectPath;
    const destination = `${ localServerHost }:${ localServerPort }/login-page`;
    it('GET /api/authn/oidc/login successfully receives a redirect to the identity provider', function (done) {
        const encodedDestination = encodeURIComponent(destination);
        request(app)
            .get(`/api/authn/oidc/login?destination=${ encodedDestination }`)
            .expect(302)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    // Save the cookies for later tests
                    const cookieData = setCookieParser(res);
                    const newCookies = cookieData.map(function(cookie) {
                        return libCookie.serialize(cookie.name, cookie.value, cookie);
                    });
                    apiCookies.push(...newCookies);

                    // Get the redirect location
                    redirectPath = res.headers.location;

                    done();
                }
            });
    });

    let signInPath;
    const ipCookies = [];
    it('redirect successfully receives a challenge from the identity provider', function (done) {
        const url = new URL(redirectPath);
        const server = `${ url.protocol }//${ url.host }`;
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
                    const cookieData = setCookieParser(res);
                    const newCookies = cookieData.map(function(cookie) {
                        return libCookie.serialize(cookie.name, cookie.value, cookie);
                    });
                    ipCookies.push(...newCookies);

                    const action = extractFormAction(res.text);
                    signInPath = action.value;

                    done();
                }
            });
    });

    it('POST formpath successfully signs into the identity provider', function (done) {
        const signinUrl = new URL(signInPath);
        const server = `${ signinUrl.protocol }//${ signinUrl.host }`;
        const path = signinUrl.pathname;
        const search = signinUrl.search;
        request(server)
            .post(path + search)
            .set('Cookie', ipCookies)
            .send('username=testuser')
            .send('password=testuser')
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
        const server = `${ url.protocol }//${ url.host }`;
        const path = url.pathname;
        const search = url.search;
        request(server)
            .get(path + search)
            .set('Cookie', apiCookies)
            .expect(302)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
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
            .set('Cookie', apiCookies)
            .expect(200)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the current session
                    const session = res.body;
                    expect(session).toBeDefined();
                    expect(session.email).toBe('test@test.com');

                    done();
                }
            });
    });

    it('GET /api/authn/oidc/logout successfully logs the user out', function (done) {
        request(app)
            .get('/api/authn/oidc/logout')
            .set('Accept', 'application/json')
            .set('Cookie', apiCookies)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    done();
                }
            });
    });

    it('GET /api/session returns not authorized (after logging out)', function (done) {
        request(app)
            .get('/api/session')
            .set('Accept', 'application/json')
            .set('Cookie', apiCookies)
            .expect(401)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    done();
                }
            });
    });

    after(async function() {
        await database.closeConnection();
        await server.close();
    });
});

