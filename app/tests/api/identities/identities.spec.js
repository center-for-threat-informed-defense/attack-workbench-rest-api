const request = require('supertest');
const expect = require('expect');
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
        name: 'identity-1',
        identity_class: 'organization',
        spec_version: '2.1',
        type: 'identity',
        description: 'This is an identity.',
        object_marking_refs: [ 'marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168' ]
    }
};

describe('Identity API', function () {
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

    it('GET /api/identities returns the placeholder identity', function (done) {
        request(app)
            .get('/api/identities')
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
                    const identities = res.body;
                    expect(identities).toBeDefined();
                    expect(Array.isArray(identities)).toBe(true);
                    expect(identities.length).toBe(1);
                    done();
                }
            });
    });

    it('POST /api/identities does not create an empty identity', function (done) {
        const body = { };
        request(app)
            .post('/api/identities')
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

    let identity1;
    it('POST /api/identities creates an identity', function (done) {
        const timestamp = new Date().toISOString();
        initialObjectData.stix.created = timestamp;
        initialObjectData.stix.modified = timestamp;
        const body = initialObjectData;
        request(app)
            .post('/api/identities')
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
                    // We expect to get the created identity
                    identity1 = res.body;
                    expect(identity1).toBeDefined();
                    expect(identity1.stix).toBeDefined();
                    expect(identity1.stix.id).toBeDefined();
                    expect(identity1.stix.created).toBeDefined();
                    expect(identity1.stix.modified).toBeDefined();
                    expect(identity1.stix.x_mitre_attack_spec_version).toBe(config.app.attackSpecVersion);

                    done();
                }
            });
    });

    it('GET /api/identities returns the added identity', function (done) {
        request(app)
            .get('/api/identities')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one identity in an array
                    const identities = res.body;
                    expect(identities).toBeDefined();
                    expect(Array.isArray(identities)).toBe(true);
                    expect(identities.length).toBe(2);
                    done();
                }
            });
    });

    it('GET /api/identities/:id should not return an identity when the id cannot be found', function (done) {
        request(app)
            .get('/api/identities/not-an-id')
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

    it('GET /api/identities/:id returns the added identity', function (done) {
        request(app)
            .get('/api/identities/' + identity1.stix.id)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one identity in an array
                    const identities = res.body;
                    expect(identities).toBeDefined();
                    expect(Array.isArray(identities)).toBe(true);
                    expect(identities.length).toBe(1);

                    const identity = identities[0];
                    expect(identity).toBeDefined();
                    expect(identity.stix).toBeDefined();
                    expect(identity.stix.id).toBe(identity1.stix.id);
                    expect(identity.stix.type).toBe(identity1.stix.type);
                    expect(identity.stix.name).toBe(identity1.stix.name);
                    expect(identity.stix.description).toBe(identity1.stix.description);
                    expect(identity.stix.spec_version).toBe(identity1.stix.spec_version);
                    expect(identity.stix.object_marking_refs).toEqual(expect.arrayContaining(identity1.stix.object_marking_refs));
                    expect(identity.stix.created_by_ref).toBe(identity1.stix.created_by_ref);
                    expect(identity.stix.x_mitre_attack_spec_version).toBe(identity1.stix.x_mitre_attack_spec_version);

                    done();
                }
            });
    });

    it('PUT /api/identities updates an identity', function (done) {
        const originalModified = identity1.stix.modified;
        const timestamp = new Date().toISOString();
        identity1.stix.modified = timestamp;
        identity1.stix.description = 'This is an updated identity.'
        const body = identity1;
        request(app)
            .put('/api/identities/' + identity1.stix.id + '/modified/' + originalModified)
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
                    // We expect to get the updated identity
                    const identity = res.body;
                    expect(identity).toBeDefined();
                    expect(identity.stix.id).toBe(identity1.stix.id);
                    expect(identity.stix.modified).toBe(identity1.stix.modified);
                    done();
                }
            });
    });

    it('POST /api/identities does not create an identity with the same id and modified date', function (done) {
        const body = identity1;
        request(app)
            .post('/api/identities')
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

    let identity2;
    it('POST /api/identities should create a new version of an identity with a duplicate stix.id but different stix.modified date', function (done) {
        identity2 = _.cloneDeep(identity1);
        identity2._id = undefined;
        identity2.__t = undefined;
        identity2.__v = undefined;
        const timestamp = new Date().toISOString();
        identity2.stix.modified = timestamp;
        const body = identity2;
        request(app)
            .post('/api/identities')
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
                    // We expect to get the created identity
                    const identity = res.body;
                    expect(identity).toBeDefined();
                    done();
                }
            });
    });

    it('GET /api/identities returns the latest added identity', function (done) {
        request(app)
            .get('/api/identities/' + identity2.stix.id)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one identity in an array
                    const identities = res.body;
                    expect(identities).toBeDefined();
                    expect(Array.isArray(identities)).toBe(true);
                    expect(identities.length).toBe(1);
                    const identity = identities[0];
                    expect(identity.stix.id).toBe(identity2.stix.id);
                    expect(identity.stix.modified).toBe(identity2.stix.modified);
                    done();
                }
            });
    });

    it('GET /api/identities returns all added identities', function (done) {
        request(app)
            .get('/api/identities/' + identity1.stix.id + '?versions=all')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get two identities in an array
                    const identities = res.body;
                    expect(identities).toBeDefined();
                    expect(Array.isArray(identities)).toBe(true);
                    expect(identities.length).toBe(2);
                    done();
                }
            });
    });

    it('GET /api/identities/:id/modified/:modified returns the first added identity', function (done) {
        request(app)
            .get('/api/identities/' + identity1.stix.id + '/modified/' + identity1.stix.modified)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one identity in an array
                    const identity = res.body;
                    expect(identity).toBeDefined();
                    expect(identity.stix).toBeDefined();
                    expect(identity.stix.id).toBe(identity1.stix.id);
                    expect(identity.stix.modified).toBe(identity1.stix.modified);
                    done();
                }
            });
    });

    it('GET /api/identities/:id/modified/:modified returns the second added identity', function (done) {
        request(app)
            .get('/api/identities/' + identity2.stix.id + '/modified/' + identity2.stix.modified)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one identity in an array
                    const identity = res.body;
                    expect(identity).toBeDefined();
                    expect(identity.stix).toBeDefined();
                    expect(identity.stix.id).toBe(identity2.stix.id);
                    expect(identity.stix.modified).toBe(identity2.stix.modified);
                    done();
                }
            });
    });   
    
    let identity3;
    it('POST /api/identities should create a new version of an identity with a duplicate stix.id but different stix.modified date', function (done) {
        identity3 = _.cloneDeep(identity1);
        identity3._id = undefined;
        identity3.__t = undefined;
        identity3.__v = undefined;
        const timestamp = new Date().toISOString();
        identity3.stix.modified = timestamp;
        const body = identity3;
        request(app)
            .post('/api/identities')
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
                    // We expect to get the created identity
                    const identity = res.body;
                    expect(identity).toBeDefined();
                    done();
                }
            });
    });

    it('DELETE /api/identities/:id should not delete a identity when the id cannot be found', function (done) {
        request(app)
            .delete('/api/identities/not-an-id')
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
    
    it('DELETE /api/identities/:id/modified/:modified deletes an identity', function (done) {
        request(app)
            .delete('/api/identities/' + identity1.stix.id + '/modified/' + identity1.stix.modified)
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
    
    it('DELETE /api/identities/:id should delete all the identities with the same stix id', function (done) {
        request(app)
            .delete('/api/identities/' + identity2.stix.id)
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

    it('GET /api/identities returns only the placeholder identity', function (done) {
        request(app)
            .get('/api/identities')
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
                    const identities = res.body;
                    expect(identities).toBeDefined();
                    expect(Array.isArray(identities)).toBe(true);
                    expect(identities.length).toBe(1);
                    done();
                }
            });
    });

    after(async function() {
        await database.closeConnection();
    });
});

