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
        workflow: {
            state: 'work-in-progress'
        }
    },
    stix: {
        name: 'matrix-1',
        spec_version: '2.1',
        type: 'x-mitre-matrix',
        description: 'This is a matrix.',
        external_references: [
            { source_name: 'source-1', external_id: 's1' }
        ],
        object_marking_refs: [ 'marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168' ],
        created_by_ref: "identity--6444f546-6900-4456-b3b1-015c88d70dab",
        tactic_refs: [
            'x-mitre-tactic--daa4cbb1-b4f4-4723-a824-7f1efd6e0592',
            'x-mitre-tactic--d679bca2-e57d-4935-8650-8031c87a4400',
        ],
        x_mitre_domains: [ 'mitre-attack' ],
        x_mitre_version: '1.0'
    }
};

describe('Matrices API', function () {
    let app;

    before(async function() {
        // Initialize the express app
        app = await require('../../../index').initializeApp();

        // Establish the database connection
        // Use an in-memory database that we spin up for the test
        await database.initializeConnection();
    });

    it('GET /api/matrices returns an empty array of matrices', function (done) {
        request(app)
            .get('/api/matrices')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get an empty array
                    const matrices = res.body;
                    expect(matrices).toBeDefined();
                    expect(Array.isArray(matrices)).toBe(true);
                    expect(matrices.length).toBe(0);
                    done();
                }
            });
    });

    it('POST /api/matrices does not create an empty matrix', function (done) {
        const body = { };
        request(app)
            .post('/api/matrices')
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

    let matrix1;
    it('POST /api/matrices creates a matrix', function (done) {
        const timestamp = new Date().toISOString();
        initialObjectData.stix.created = timestamp;
        initialObjectData.stix.modified = timestamp;
        const body = initialObjectData;
        request(app)
            .post('/api/matrices')
            .send(body)
            .set('Accept', 'application/json')
            .expect(201)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the created matrix
                    matrix1 = res.body;
                    expect(matrix1).toBeDefined();
                    expect(matrix1.stix).toBeDefined();
                    expect(matrix1.stix.id).toBeDefined();
                    expect(matrix1.stix.created).toBeDefined();
                    expect(matrix1.stix.modified).toBeDefined();
                    done();
                }
            });
    });

    it('GET /api/matrices returns the added matrix', function (done) {
        request(app)
            .get('/api/matrices')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one matrix in an array
                    const matrices = res.body;
                    expect(matrices).toBeDefined();
                    expect(Array.isArray(matrices)).toBe(true);
                    expect(matrices.length).toBe(1);
                    done();
                }
            });
    });

    it('GET /api/matrices/:id should not return a matrix when the id cannot be found', function (done) {
        request(app)
            .get('/api/matrices/not-an-id')
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

    it('GET /api/matrices/:id returns the added matrix', function (done) {
        request(app)
            .get('/api/matrices/' + matrix1.stix.id)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one matrix in an array
                    const matrices = res.body;
                    expect(matrices).toBeDefined();
                    expect(Array.isArray(matrices)).toBe(true);
                    expect(matrices.length).toBe(1);

                    const matrix = matrices[0];
                    expect(matrix).toBeDefined();
                    expect(matrix.stix).toBeDefined();
                    expect(matrix.stix.id).toBe(matrix1.stix.id);
                    expect(matrix.stix.created).toBeDefined();
                    expect(matrix.stix.modified).toBeDefined();
                    expect(matrix.stix.type).toBe(matrix1.stix.type);
                    expect(matrix.stix.name).toBe(matrix1.stix.name);
                    expect(matrix.stix.description).toBe(matrix1.stix.description);
                    expect(matrix.stix.spec_version).toBe(matrix1.stix.spec_version);
                    expect(matrix.stix.object_marking_refs).toEqual(expect.arrayContaining(matrix1.stix.object_marking_refs));
                    expect(matrix.stix.created_by_ref).toBe(matrix1.stix.created_by_ref);

                    done();
                }
            });
    });

    it('PUT /api/matrices updates a matrix', function (done) {
        const originalModified = matrix1.stix.modified;
        const timestamp = new Date().toISOString();
        matrix1.stix.modified = timestamp;
        matrix1.stix.description = 'This is an updated matrix.'
        const body = matrix1;
        request(app)
            .put('/api/matrices/' + matrix1.stix.id + '/modified/' + originalModified)
            .send(body)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the updated matrix
                    const matrix = res.body;
                    expect(matrix).toBeDefined();
                    expect(matrix.stix.id).toBe(matrix1.stix.id);
                    expect(matrix.stix.modified).toBe(matrix1.stix.modified);
                    done();
                }
            });
    });

    it('POST /api/matrices does not create a matrix with the same id and modified date', function (done) {
        const body = matrix1;
        request(app)
            .post('/api/matrices')
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

    let matrix2;
    it('POST /api/matrices should create a new version of a matrix with a duplicate stix.id but different stix.modified date', function (done) {
        matrix2 = _.cloneDeep(matrix1);
        matrix2._id = undefined;
        matrix2.__t = undefined;
        matrix2.__v = undefined;
        const timestamp = new Date().toISOString();
        matrix2.stix.modified = timestamp;
        const body = matrix2;
        request(app)
            .post('/api/matrices')
            .send(body)
            .set('Accept', 'application/json')
            .expect(201)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the created matrix
                    const matrix = res.body;
                    expect(matrix).toBeDefined();
                    done();
                }
            });
    });

    it('GET /api/matrices returns the latest added matrix', function (done) {
        request(app)
            .get('/api/matrices/' + matrix2.stix.id)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one matrix in an array
                    const matrices = res.body;
                    expect(matrices).toBeDefined();
                    expect(Array.isArray(matrices)).toBe(true);
                    expect(matrices.length).toBe(1);
                    const matrix = matrices[0];
                    expect(matrix.stix.id).toBe(matrix2.stix.id);
                    expect(matrix.stix.modified).toBe(matrix2.stix.modified);
                    done();
                }
            });
    });

    it('GET /api/matrices returns all added matrices', function (done) {
        request(app)
            .get('/api/matrices/' + matrix1.stix.id + '?versions=all')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get two matrices in an array
                    const matrices = res.body;
                    expect(matrices).toBeDefined();
                    expect(Array.isArray(matrices)).toBe(true);
                    expect(matrices.length).toBe(2);
                    done();
                }
            });
    });

    it('GET /api/matrices/:id/modified/:modified returns the first added matrix', function (done) {
        request(app)
            .get('/api/matrices/' + matrix1.stix.id + '/modified/' + matrix1.stix.modified)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one matrix in an array
                    const matrix = res.body;
                    expect(matrix).toBeDefined();
                    expect(matrix.stix).toBeDefined();
                    expect(matrix.stix.id).toBe(matrix1.stix.id);
                    expect(matrix.stix.modified).toBe(matrix1.stix.modified);
                    done();
                }
            });
    });

    it('GET /api/matrices/:id/modified/:modified returns the second added matrix', function (done) {
        request(app)
            .get('/api/matrices/' + matrix2.stix.id + '/modified/' + matrix2.stix.modified)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one matrix in an array
                    const matrix = res.body;
                    expect(matrix).toBeDefined();
                    expect(matrix.stix).toBeDefined();
                    expect(matrix.stix.id).toBe(matrix2.stix.id);
                    expect(matrix.stix.modified).toBe(matrix2.stix.modified);
                    done();
                }
            });
    });

    it('DELETE /api/matrices deletes a matrix', function (done) {
        request(app)
            .delete('/api/matrices/' + matrix1.stix.id + '/modified/' + matrix1.stix.modified)
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

    it('DELETE /api/matrices should delete the second matrix', function (done) {
        request(app)
            .delete('/api/matrices/' + matrix2.stix.id + '/modified/' + matrix2.stix.modified)
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

    it('GET /api/matrices returns an empty array of matrices', function (done) {
        request(app)
            .get('/api/matrices')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get an empty array
                    const matrices = res.body;
                    expect(matrices).toBeDefined();
                    expect(Array.isArray(matrices)).toBe(true);
                    expect(matrices.length).toBe(0);
                    done();
                }
            });
    });

    after(async function() {
        await database.closeConnection();
    });
});

