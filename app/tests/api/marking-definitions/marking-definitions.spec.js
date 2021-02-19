const request = require('supertest');
const database = require('../../../lib/database-in-memory')
const expect = require('expect');

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
        spec_version: '2.1',
        type: 'marking-definition',
        definition_type: 'statement',
        definition: { statement: 'This is a marking definition.' },
        created_by_ref: "identity--6444f546-6900-4456-b3b1-015c88d70dab"
    }
};

describe('Marking Definitions API', function () {
    let app;

    before(async function() {
        // Initialize the express app
        app = await require('../../../index').initializeApp();

        // Establish the database connection
        // Use an in-memory database that we spin up for the test
        await database.initializeConnection();
    });

    it('GET /api/marking-definitions returns an empty array of marking definitions', function (done) {
        request(app)
            .get('/api/marking-definitions')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get an empty array
                    const markingDefinitions = res.body;
                    expect(markingDefinitions).toBeDefined();
                    expect(Array.isArray(markingDefinitions)).toBe(true);
                    expect(markingDefinitions.length).toBe(0);
                    done();
                }
            });
    });

    it('POST /api/marking-definitions does not create an empty marking definition', function (done) {
        const body = { };
        request(app)
            .post('/api/marking-definitions')
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

    let markingDefinition1;
    it('POST /api/marking-definitions creates a marking definition', function (done) {
        const timestamp = new Date().toISOString();
        initialObjectData.stix.created = timestamp;
        const body = initialObjectData;
        request(app)
            .post('/api/marking-definitions')
            .send(body)
            .set('Accept', 'application/json')
            .expect(201)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the created marking definition
                    markingDefinition1 = res.body;
                    expect(markingDefinition1).toBeDefined();
                    done();
                }
            });
    });

    it('GET /api/marking-definitions returns the added marking definition', function (done) {
        request(app)
            .get('/api/marking-definitions')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one marking definition in an array
                    const markingDefinitions = res.body;
                    expect(markingDefinitions).toBeDefined();
                    expect(Array.isArray(markingDefinitions)).toBe(true);
                    expect(markingDefinitions.length).toBe(1);
                    done();
                }
            });
    });

    it('GET /api/marking-definitions/:id should not return a marking definition when the id cannot be found', function (done) {
        request(app)
            .get('/api/marking-definitions/not-an-id')
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

    it('GET /api/marking-definitions/:id returns the added marking definition', function (done) {
        request(app)
            .get('/api/marking-definitions/' + markingDefinition1.stix.id)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one marking definition in an array
                    const markingDefinitions = res.body;
                    expect(markingDefinitions).toBeDefined();
                    expect(Array.isArray(markingDefinitions)).toBe(true);
                    expect(markingDefinitions.length).toBe(1);

                    const markingDefinition = markingDefinitions[0];
                    expect(markingDefinition).toBeDefined();
                    expect(markingDefinition.stix).toBeDefined();
                    expect(markingDefinition.stix.id).toBe(markingDefinition1.stix.id);
                    expect(markingDefinition.stix.type).toBe(markingDefinition1.stix.type);
                    expect(markingDefinition.stix.name).toBe(markingDefinition1.stix.name);
                    expect(markingDefinition.stix.description).toBe(markingDefinition1.stix.description);
                    expect(markingDefinition.stix.spec_version).toBe(markingDefinition1.stix.spec_version);
                    expect(markingDefinition.stix.object_marking_refs).toEqual(expect.arrayContaining(markingDefinition1.stix.object_marking_refs));
                    expect(markingDefinition.stix.created_by_ref).toBe(markingDefinition1.stix.created_by_ref);

                    done();
                }
            });
    });

    it('PUT /api/marking-definitions updates a marking definition', function (done) {
        markingDefinition1.stix.description = 'This is an updated marking definition.'
        const body = markingDefinition1;
        request(app)
            .put('/api/marking-definitions/' + markingDefinition1.stix.id)
            .send(body)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the updated marking definition
                    const markingDefinition = res.body;
                    expect(markingDefinition).toBeDefined();
                    expect(markingDefinition.stix.id).toBe(markingDefinition1.stix.id);
                    done();
                }
            });
    });

    it('POST /api/marking-definitions does not create a marking definition with the same id', function (done) {
        const body = markingDefinition1;
        request(app)
            .post('/api/marking-definitions')
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

    it('DELETE /api/marking-definitions deletes a marking definition', function (done) {
        request(app)
            .delete('/api/marking-definitions/' + markingDefinition1.stix.id)
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

    it('GET /api/marking-definitions returns an empty array of marking definitions', function (done) {
        request(app)
            .get('/api/marking-definitions')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get an empty array
                    const markingDefinitions = res.body;
                    expect(markingDefinitions).toBeDefined();
                    expect(Array.isArray(markingDefinitions)).toBe(true);
                    expect(markingDefinitions.length).toBe(0);
                    done();
                }
            });
    });

    after(async function() {
        await database.closeConnection();
    });
});

