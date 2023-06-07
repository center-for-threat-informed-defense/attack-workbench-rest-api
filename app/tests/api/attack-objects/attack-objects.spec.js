const { promises: fs } = require('fs');

const request = require('supertest');
const { expect } = require('expect');

const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');
const AttackObject = require('../../../models/attack-object-model');
const login = require('../../shared/login');

const logger = require('../../../lib/logger');
const util = require("util");
const collectionBundlesService = require("../../../services/collection-bundles-service");
logger.level = 'debug';

// test malware object
const malwareObject = {
    workspace: {
        workflow: {
            state: 'work-in-progress',
        },
    },
    stix: {
        id: "malware--1c1ab115-f015-462c-92a0-f887277d8519",
        name: "software-2",
        "spec_version": "2.1",
        type: "malware",
        description: "This is a malware type of software.",
        is_family: false,
        object_marking_refs: [ "marking-definition--c2a0b8f8-51d4-4702-8e42-ce7a65235bce" ],
        x_mitre_version: "1.1",
        x_mitre_contributors: [
          "contributor-mk",
          "contributor-cm"
        ],
        x_mitre_domains: [
          "mobile-attack"
        ],
        created: "2023-03-01T00:00:00.000Z",
        modified: "2023-03-01T00:00:00.000Z",
    }
};

async function readJson(path) {
    const data = await fs.readFile(require.resolve(path));
    return JSON.parse(data);
}

describe('ATT&CK Objects API', function () {
    let app;
    let passportCookie;

    const importBundle = util.promisify(collectionBundlesService.importBundle);
    before(async function() {
        // Establish the database connection
        // Use an in-memory database that we spin up for the test
        await database.initializeConnection();

        // Wait until the indexes are created
        await AttackObject.init();

        // Check for a valid database configuration
        await databaseConfiguration.checkSystemConfiguration();

        // Initialize the express app
        app = await require('../../../index').initializeApp();

        const collectionBundle1 = await readJson('./attack-objects-1.json');
        const collectionList1 = collectionBundle1.objects.filter(object => object.type === 'x-mitre-collection');

        const importOptions = {};
        await importBundle(collectionList1[0], collectionBundle1, importOptions);

        const collectionBundle2 = await readJson('./attack-objects-2.json');
        const collectionList2 = collectionBundle2.objects.filter(object => object.type === 'x-mitre-collection');

        await importBundle(collectionList2[0], collectionBundle2, importOptions);

        // Log into the app
        passportCookie = await login.loginAnonymous(app);
    });

    it('GET /api/attack-objects returns the ATT&CK objects imported from the collection bundles', function (done) {
        request(app)
            .get('/api/attack-objects')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get ATT&CK objects in an array
                    const attackObjects = res.body;
                    expect(attackObjects).toBeDefined();
                    expect(Array.isArray(attackObjects)).toBe(true);

                    // We expect the placeholder identity and the new collection identity
                    const identities = attackObjects.filter(x => x.stix.type === 'identity');
                    expect(identities.length).toBe(2);

                    // We expect the 4 TLP marking definitions and the new collection identity
                    const markingDefinitions = attackObjects.filter(x => x.stix.type === 'marking-definition');
                    expect(markingDefinitions.length).toBe(5);

                    // Placeholder identity, 4 TLP marking definitions, 17 collection contents, 1 collection object
                    expect(attackObjects.length).toBe(1 + 4 + 17 + 1);
                    done();
                }
            });
    });

    it('GET /api/attack-objects returns all versions of the ATT&CK objects imported from the collection bundles', function (done) {
        request(app)
            .get('/api/attack-objects?versions=all')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get ATT&CK objects in an array
                    const attackObjects = res.body;
                    expect(attackObjects).toBeDefined();
                    expect(Array.isArray(attackObjects)).toBe(true);

                    // We expect the placeholder identity and the new collection identity
                    const identities = attackObjects.filter(x => x.stix.type === 'identity');
                    expect(identities.length).toBe(2);

                    // We expect the 4 TLP marking definitions and the new collection identity
                    const markingDefinitions = attackObjects.filter(x => x.stix.type === 'marking-definition');
                    expect(markingDefinitions.length).toBe(5);

                    // Placeholder identity, 4 TLP marking definitions, 18 collection contents, 2 collection objects
                    expect(attackObjects.length).toBe(1 + 4 + 18 + 2);
                    done();
                }
            });
    });

    it('GET /api/attack-objects returns zero objects with an ATT&CK ID that does not exist', function (done) {
        request(app)
            .get('/api/attack-objects?attackId=T1234')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get an empty array
                    const attackObjects = res.body;
                    expect(attackObjects).toBeDefined();
                    expect(Array.isArray(attackObjects)).toBe(true);
                    expect(attackObjects.length).toBe(0);
                    done();
                }
            });
    });

    it('GET /api/attack-objects returns the group with ATT&CK ID GX1111', function (done) {
        request(app)
            .get('/api/attack-objects?attackId=GX1111')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the matching group object
                    const attackObjects = res.body;
                    expect(attackObjects).toBeDefined();
                    expect(Array.isArray(attackObjects)).toBe(true);
                    expect(attackObjects.length).toBe(1);

                    done();
                }
            });
    });

    it('GET /api/attack-objects returns the software with ATT&CK ID SX3333', function (done) {
        request(app)
            .get('/api/attack-objects?attackId=SX3333')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the matching software object
                    const attackObjects = res.body;
                    expect(attackObjects).toBeDefined();
                    expect(Array.isArray(attackObjects)).toBe(true);
                    expect(attackObjects.length).toBe(1);

                    done();
                }
            });
    });

    it('GET /api/attack-objects returns the technique with ATT&CK ID TX0001', function (done) {
        request(app)
            .get('/api/attack-objects?attackId=TX0001')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the matching objects
                    const attackObjects = res.body;
                    expect(attackObjects).toBeDefined();
                    expect(Array.isArray(attackObjects)).toBe(true);
                    expect(attackObjects.length).toBe(1);

                    done();
                }
            });
    });

    it('GET /api/attack-objects returns the objects with the requested ATT&CK IDs', function (done) {
        request(app)
            .get('/api/attack-objects?attackId=GX1111&attackId=SX3333&attackId=TX0001')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the matching objects
                    const attackObjects = res.body;
                    expect(attackObjects).toBeDefined();
                    expect(Array.isArray(attackObjects)).toBe(true);
                    expect(attackObjects.length).toBe(3);

                    done();
                }
            });
    });

    it('GET /api/attack-objects uses the search parameter to return the tactic objects', function (done) {
        request(app)
            .get('/api/attack-objects?search=nabu')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the matching objects
                    const attackObjects = res.body;
                    expect(attackObjects).toBeDefined();
                    expect(Array.isArray(attackObjects)).toBe(true);
                    expect(attackObjects.length).toBe(2);
                    expect(attackObjects[0].stix.type).toBe('x-mitre-tactic');
                    expect(attackObjects[1].stix.type).toBe('x-mitre-tactic');

                    done();
                }
            });
    });

    let software1;
    it('POST /api/software creates a software', function (done) {
        // Further setup - need to index malware object with in database first
        const body = malwareObject;
        request(app)
            .post('/api/software')
            .send(body)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(201)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    software1 = res.body;
                    expect(software1).toBeDefined();
                    expect(software1.stix).toBeDefined();
                    expect(software1.stix.id).toBeDefined();
                    expect(software1.stix.created).toBeDefined();
                    expect(software1.stix.modified).toBeDefined();

                    done();
                }
            });
    });

    it('GET /api/attack-objects uses the users parameter to return objects by user identity', function (done) {
        request(app)
            .get(`/api/attack-objects?lastUpdatedBy=${software1.workspace.workflow.created_by_user_account}`)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the matching objects
                    const attackObjects = res.body;
                    expect(attackObjects).toBeDefined();
                    expect(Array.isArray(attackObjects)).toBe(true);
                    expect(attackObjects.length).toBe(1);
                    expect(attackObjects[0].stix.type).toBe('malware');

                    done();
                }
            });
    });

    after(async function() {
        await database.closeConnection();
    });
});

