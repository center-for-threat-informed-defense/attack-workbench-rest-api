const request = require('supertest');
const { expect } = require('expect');
const _ = require('lodash');

const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');

const config = require('../../../config/config');
const login = require('../../shared/login');

const logger = require('../../../lib/logger');
logger.level = 'debug';

// modified and created properties will be set before calling REST API
// stix.id property will be created by REST API
const initialObjectData = {
    workspace: {
        workflow: {
            state: 'work-in-progress'
        }
    },
    stix: {
        name: 'x-mitre-tactic-1',
        spec_version: '2.1',
        type: 'x-mitre-tactic',
        description: 'This is a tactic. yellow.',
        external_references: [
            { source_name: 'source-1', external_id: 's1' }
        ],
        object_marking_refs: [ 'marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168' ]
    }
};

describe('Tactics API', function () {
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

        // Log into the app
        passportCookie = await login.loginAnonymous(app);
    });

    it('GET /api/tactics returns an empty array of tactics', function (done) {
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
                    // We expect to get an empty array
                    const tactics = res.body;
                    expect(tactics).toBeDefined();
                    expect(Array.isArray(tactics)).toBe(true);
                    expect(tactics.length).toBe(0);
                    done();
                }
            });
    });

    it('POST /api/tactics does not create an empty tactic', function (done) {
        const body = { };
        request(app)
            .post('/api/tactics')
            .send(body)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(400)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    done();
                }
            });
    });

    let tactic1;
    it('POST /api/tactics creates a tactic', function (done) {
        const timestamp = new Date().toISOString();
        initialObjectData.stix.created = timestamp;
        initialObjectData.stix.modified = timestamp;
        const body = initialObjectData;
        request(app)
            .post('/api/tactics')
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
                    // We expect to get the created tactic
                    tactic1 = res.body;
                    expect(tactic1).toBeDefined();
                    expect(tactic1.stix).toBeDefined();
                    expect(tactic1.stix.id).toBeDefined();
                    expect(tactic1.stix.created).toBeDefined();
                    expect(tactic1.stix.modified).toBeDefined();
                    expect(tactic1.stix.created_by_ref).toBeDefined();
                    expect(tactic1.stix.x_mitre_modified_by_ref).toBeDefined();
                    expect(tactic1.stix.created_by_ref).toBe(tactic1.stix.x_mitre_modified_by_ref);
                    expect(tactic1.stix.x_mitre_attack_spec_version).toBe(config.app.attackSpecVersion);

                    done();
                }
            });
    });

    it('GET /api/tactics returns the added tactic', function (done) {
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
                    // We expect to get one tactic in an array
                    const tactics = res.body;
                    expect(tactics).toBeDefined();
                    expect(Array.isArray(tactics)).toBe(true);
                    expect(tactics.length).toBe(1);
                    done();
                }
            });
    });

    it('GET /api/tactics/:id should not return a tactic when the id cannot be found', function (done) {
        request(app)
            .get('/api/tactics/not-an-id')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(404)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    done();
                }
            });
    });

    it('GET /api/tactics/:id returns the added tactic', function (done) {
        request(app)
            .get('/api/tactics/' + tactic1.stix.id)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one tactic in an array
                    const tactics = res.body;
                    expect(tactics).toBeDefined();
                    expect(Array.isArray(tactics)).toBe(true);
                    expect(tactics.length).toBe(1);

                    const tactic = tactics[0];
                    expect(tactic).toBeDefined();
                    expect(tactic.stix).toBeDefined();
                    expect(tactic.stix.id).toBe(tactic1.stix.id);
                    expect(tactic.stix.type).toBe(tactic1.stix.type);
                    expect(tactic.stix.name).toBe(tactic1.stix.name);
                    expect(tactic.stix.description).toBe(tactic1.stix.description);
                    expect(tactic.stix.spec_version).toBe(tactic1.stix.spec_version);
                    expect(tactic.stix.object_marking_refs).toEqual(expect.arrayContaining(tactic1.stix.object_marking_refs));
                    expect(tactic.stix.created_by_ref).toBe(tactic1.stix.created_by_ref);
                    expect(tactic.stix.x_mitre_modified_by_ref).toBe(tactic1.stix.x_mitre_modified_by_ref);
                    expect(tactic.stix.x_mitre_attack_spec_version).toBe(tactic1.stix.x_mitre_attack_spec_version);

                    expect(tactic.stix.x_mitre_deprecated).not.toBeDefined();

                    done();
                }
            });
    });

    it('PUT /api/tactics updates a tactic', function (done) {
        const originalModified = tactic1.stix.modified;
        const timestamp = new Date().toISOString();
        tactic1.stix.modified = timestamp;
        tactic1.stix.description = 'This is an updated tactic.'
        const body = tactic1;
        request(app)
            .put('/api/tactics/' + tactic1.stix.id + '/modified/' + originalModified)
            .send(body)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the updated tactic
                    const tactic = res.body;
                    expect(tactic).toBeDefined();
                    expect(tactic.stix.id).toBe(tactic1.stix.id);
                    expect(tactic.stix.modified).toBe(tactic1.stix.modified);
                    done();
                }
            });
    });

    it('POST /api/tactics does not create a tactic with the same id and modified date', function (done) {
        const body = tactic1;
        request(app)
            .post('/api/tactics')
            .send(body)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(409)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    done();
                }
            });
    });

    let tactic2;
    it('POST /api/tactics should create a new version of a tactic with a duplicate stix.id but different stix.modified date', function (done) {
        tactic2 = _.cloneDeep(tactic1);
        tactic2._id = undefined;
        tactic2.__t = undefined;
        tactic2.__v = undefined;
        const timestamp = new Date().toISOString();
        tactic2.stix.description = 'Still a tactic. Red.'
        tactic2.stix.modified = timestamp;
        const body = tactic2;
        request(app)
            .post('/api/tactics')
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
                    // We expect to get the created tactic
                    const tactic = res.body;
                    expect(tactic).toBeDefined();
                    done();
                }
            });
    });
    
    let tactic3;
    it('POST /api/tactics should create a new version of a tactic with a duplicate stix.id but different stix.modified date', function (done) {
        tactic3 = _.cloneDeep(tactic1);
        tactic3._id = undefined;
        tactic3.__t = undefined;
        tactic3.__v = undefined;
        const timestamp = new Date().toISOString();
        tactic3.stix.description = 'Still a tactic. Violet.'
        tactic3.stix.modified = timestamp;
        const body = tactic3;
        request(app)
            .post('/api/tactics')
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
                    // We expect to get the created tactic
                    const tactic = res.body;
                    expect(tactic).toBeDefined();
                    done();
                }
            });
    });
    

    it('GET /api/tactics returns the latest added tactic', function (done) {
        request(app)
            .get('/api/tactics/' + tactic3.stix.id)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one tactic in an array
                    const tactics = res.body;
                    expect(tactics).toBeDefined();
                    expect(Array.isArray(tactics)).toBe(true);
                    expect(tactics.length).toBe(1);
                    const tactic = tactics[0];
                    expect(tactic.stix.id).toBe(tactic3.stix.id);
                    expect(tactic.stix.modified).toBe(tactic3.stix.modified);
                    done();
                }
            });
    });

    it('GET /api/tactics returns all added tactics', function (done) {
        request(app)
            .get('/api/tactics/' + tactic1.stix.id + '?versions=all')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get two tactics in an array
                    const tactics = res.body;
                    expect(tactics).toBeDefined();
                    expect(Array.isArray(tactics)).toBe(true);
                    expect(tactics.length).toBe(3);
                    done();
                }
            });
    });

    it('GET /api/tactics/:id/modified/:modified returns the first added tactic', function (done) {
        request(app)
            .get('/api/tactics/' + tactic1.stix.id + '/modified/' + tactic1.stix.modified)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one tactic in an array
                    const tactic = res.body;
                    expect(tactic).toBeDefined();
                    expect(tactic.stix).toBeDefined();
                    expect(tactic.stix.id).toBe(tactic1.stix.id);
                    expect(tactic.stix.modified).toBe(tactic1.stix.modified);
                    done();
                }
            });
    });

    it('GET /api/tactics/:id/modified/:modified returns the second added tactic', function (done) {
        request(app)
            .get('/api/tactics/' + tactic2.stix.id + '/modified/' + tactic2.stix.modified)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one tactic in an array
                    const tactic = res.body;
                    expect(tactic).toBeDefined();
                    expect(tactic.stix).toBeDefined();
                    expect(tactic.stix.id).toBe(tactic2.stix.id);
                    expect(tactic.stix.modified).toBe(tactic2.stix.modified);
                    done();
                }
            });
    });

    it('GET /api/tactics uses the search parameter to return the latest version of the tactic', function (done) {
        request(app)
            .get('/api/tactics?search=violet')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one tactic in an array
                    const tactics = res.body;
                    expect(tactics).toBeDefined();
                    expect(Array.isArray(tactics)).toBe(true);
                    expect(tactics.length).toBe(1);

                    // We expect it to be the latest version of the tactic
                    const tactic = tactics[0];
                    expect(tactic).toBeDefined();
                    expect(tactic.stix).toBeDefined();
                    expect(tactic.stix.id).toBe(tactic3.stix.id);
                    expect(tactic.stix.modified).toBe(tactic3.stix.modified);
                    done();
                }
            });
    });

    it('GET /api/tactics should not get the first version of the tactic when using the search parameter', function (done) {
        request(app)
            .get('/api/tactics?search=yellow')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get zero tactics in an array
                    const tactics = res.body;
                    expect(tactics).toBeDefined();
                    expect(Array.isArray(tactics)).toBe(true);
                    expect(tactics.length).toBe(0);
                    done();
                }
            });
    });

    it('DELETE /api/tactics/:id should not delete a tactic when the id cannot be found', function (done) {
        request(app)
            .delete('/api/tactics/not-an-id')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(404)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    done();
                }
            });
    });

    it('DELETE /api/tactics/:id/modified/:modified deletes a tactic', function (done) {
        request(app)
            .delete('/api/tactics/' + tactic1.stix.id + '/modified/' + tactic1.stix.modified)
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(204)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    done();
                }
            });
    });
        
    it('DELETE /api/tactics/:id should delete all the tactics with the same stix id', function (done) {
        request(app)
            .delete('/api/tactics/' + tactic2.stix.id)
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(204)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    done();
                }
            });
    });    
	
    it('GET /api/tactics returns an empty array of tactics', function (done) {
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
                    // We expect to get an empty array
                    const tactics = res.body;
                    expect(tactics).toBeDefined();
                    expect(Array.isArray(tactics)).toBe(true);
                    expect(tactics.length).toBe(0);
                    done();
                }
            });
    });

    after(async function() {
        await database.closeConnection();
    });
});

