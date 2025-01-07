const request = require('supertest');
const { expect } = require('expect');
const setCookieParser = require('set-cookie-parser');

const database = require('../../lib/database-in-memory');
const databaseConfiguration = require('../../lib/database-configuration');

const logger = require('../../lib/logger');
logger.level = 'debug';

const passportCookieName = 'connect.sid';

describe('Anonymous User Authentication', function () {
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

  let passportCookie;
  it('GET /api/authn/anonymous/login successfully logs the user in', function (done) {
    request(app)
      .get('/api/authn/anonymous/login')
      .set('Accept', 'application/json')
      .expect(200)
      .end(function (err, res) {
        if (err) {
          done(err);
        } else {
          // Save the cookie for later tests
          const cookies = setCookieParser(res);
          passportCookie = cookies.find((c) => c.name === passportCookieName);
          expect(passportCookie).toBeDefined();

          done();
        }
      });
  });

  it('GET /api/session returns the user session', function (done) {
    request(app)
      .get('/api/session')
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookieName}=${passportCookie.value}`)
      .expect(200)
      .end(function (err, res) {
        if (err) {
          done(err);
        } else {
          // We expect to get the current session
          const session = res.body;
          expect(session).toBeDefined();

          done();
        }
      });
  });

  it('GET /api/authn/anonymous/logout successfully logs the user out', function (done) {
    request(app)
      .get('/api/authn/anonymous/logout')
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookieName}=${passportCookie.value}`)
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
      .set('Cookie', `${passportCookieName}=${passportCookie.value}`)
      .expect(401)
      .end(function (err, res) {
        if (err) {
          done(err);
        } else {
          done();
        }
      });
  });

  it('GET /api/authn/oidc/login cannot log in using incorrect authentication mechanism', function (done) {
    const encodedDestination = encodeURIComponent('http://localhost/startPage');
    request(app)
      .get(`/api/authn/oidc/login?destination=${encodedDestination}`)
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

  it('GET /api/authn/oidc/logout cannot log out using incorrect authentication mechanism', function (done) {
    request(app)
      .get('/api/authn/oidc/logout')
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

  after(async function () {
    await database.closeConnection();
  });
});
