const fs = require('fs').promises;

const request = require('supertest');
const { expect } = require('expect');
const util = require('util');

const login = require('../../shared/login');

const logger = require('../../../lib/logger');
logger.level = 'debug';

const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');

const collectionBundlesService = require('../../../services/collection-bundles-service');

async function readJson(path) {
    const data = await fs.readFile(require.resolve(path));
    return JSON.parse(data);
}

const importBundle = util.promisify(collectionBundlesService.importBundle);

describe('Tactics with Techniques API', function () {
    let app;
    let passportCookie;

    before(async function() {
        // Establish the database connection
        // Use an in-memory database that we spin up for the test
        await database.initializeConnection();

        // Check for a valid database configuration
        await databaseConfiguration.checkSystemConfiguration();

        // Initialize the express app
        app = await require('../../../index').initializeApp();

        const collectionBundle = await readJson('./tactics.techniques.json');
        const collections = collectionBundle.objects.filter(object => object.type === 'x-mitre-collection');

        const importOptions = {};
        await importBundle(collections[0], collectionBundle, importOptions);

        // Log into the app
        passportCookie = await login.loginAnonymous(app);
    });

    let tactic1;
    let tactic2;
    it('GET /api/tactics should return the preloaded tactics', function (done) {
        request(app)
            .get('/api/tactics')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    const tactics = res.body;
                    expect(tactics).toBeDefined();
                    expect(Array.isArray(tactics)).toBe(true);
                    expect(tactics.length).toBe(6);

                    tactic1 = tactics.find(t => t.stix.x_mitre_shortname === 'enlil');
                    tactic2 = tactics.find(t => t.stix.x_mitre_shortname === 'nabu');

                    done();
                }
            });
    });

    it('GET /api/techniques should return the preloaded techniques', function (done) {
        request(app)
            .get('/api/techniques')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    const techniques = res.body;
                    expect(techniques).toBeDefined();
                    expect(Array.isArray(techniques)).toBe(true);
                    expect(techniques.length).toBe(5);
                    done();
                }
            });
    });

    it('GET /api/tactics/:id/modified/:modified/techniques should not return the techniques when the tactic cannot be found', function (done) {
        request(app)
            .get(`/api/tactics/not-an-id/modified/2022-01-01T00:00:00.000Z/techniques`)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(404)
            .end(function (err, res) {
                if (err) {
                    done(err);
                }
                else {
                    done();
                }
            });
    });

    it('GET /api/tactics/:id/modified/:modified/techniques should return the techniques for tactic 1', function (done) {
        request(app)
            .get(`/api/tactics/${ tactic1.stix.id }/modified/${ tactic1.stix.modified }/techniques`)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    const tactics = res.body;
                    expect(tactics).toBeDefined();
                    expect(Array.isArray(tactics)).toBe(true);
                    expect(tactics.length).toBe(2);
                    done();
                }
            });
    });

    it('GET /api/tactics/:id/modified/:modified/techniques should return the first page of techniques for tactic 2', function (done) {
        request(app)
            .get(`/api/tactics/${ tactic2.stix.id }/modified/${ tactic2.stix.modified }/techniques?offset=0&limit=2&includePagination=true`)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    const results = res.body;
                    const tactics = results.data;
                    expect(tactics).toBeDefined();
                    expect(Array.isArray(tactics)).toBe(true);
                    expect(tactics.length).toBe(2);
                    done();
                }
            });
    });

    after(async function() {
        await database.closeConnection();
    });
});

