const request = require('supertest');
const database = require('../../../lib/database-in-memory')
const expect = require('expect');
const _ = require('lodash');

const logger = require('../../../lib/logger');
logger.level = 'debug';

// modified and created properties will be set before calling REST API
// stix.id property will be created by REST API
const initialObjectData = {
    workspace: {
        domains: [ 'domain-1']
    },
    stix: {
        name: 'x-mitre-tactic-1',
        spec_version: '2.1',
        type: 'x-mitre-tactic',
        description: 'This is a tactic.',
        external_references: [
            { source_name: 'source-1', external_id: 's1' }
        ],
        object_marking_refs: [ 'marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168' ],
        created_by_ref: "identity--6444f546-6900-4456-b3b1-015c88d70dab"
    }
};

describe('Tactics API', function () {
    let app;

    before(async function() {
        // Initialize the express app
        app = await require('../../../index').initializeApp();

        // Establish the database connection
        // Use an in-memory database that we spin up for the test
        await database.initializeConnection();
    });

    it('GET /api/tactics returns an empty array of tactics', function (done) {
        request(app)
            .get('/api/tactics')
            .set('Accept', 'application/json')
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
                    done();
                }
            });
    });

    it('GET /api/tactics returns the added tactic', function (done) {
        request(app)
            .get('/api/tactics')
            .set('Accept', 'application/json')
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
        tactic2.stix.modified = timestamp;
        const body = tactic2;
        request(app)
            .post('/api/tactics')
            .send(body)
            .set('Accept', 'application/json')
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
            .get('/api/tactics/' + tactic2.stix.id)
            .set('Accept', 'application/json')
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
                    expect(tactic.stix.id).toBe(tactic2.stix.id);
                    expect(tactic.stix.modified).toBe(tactic2.stix.modified);
                    done();
                }
            });
    });

    it('GET /api/tactics returns all added tactics', function (done) {
        request(app)
            .get('/api/tactics/' + tactic1.stix.id + '?versions=all')
            .set('Accept', 'application/json')
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
                    expect(tactics.length).toBe(2);
                    done();
                }
            });
    });

    it('GET /api/tactics/:id/modified/:modified returns the first added tactic', function (done) {
        request(app)
            .get('/api/tactics/' + tactic1.stix.id + '/modified/' + tactic1.stix.modified)
            .set('Accept', 'application/json')
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

    it('DELETE /api/tactics deletes a tactic', function (done) {
        request(app)
            .delete('/api/tactics/' + tactic1.stix.id + '/modified/' + tactic1.stix.modified)
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

    it('DELETE /api/tactics should delete the second tactic', function (done) {
        request(app)
            .delete('/api/tactics/' + tactic2.stix.id + '/modified/' + tactic2.stix.modified)
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

