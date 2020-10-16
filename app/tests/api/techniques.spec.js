const request = require('supertest');
const database = require('../../lib/database-in-memory')
const expect = require('expect');

const logger = require('../../lib/logger');
logger.level = 'debug';

const object1 = {
    stix: {
        name: 'mercury',
        spec_version: '2.1',
        type: 'attack-pattern'
    }
};

let object2;

let app;
before(async function() {
    // Establish the database connection
    // Use an in-memory database that we spin up for the test
    await database.initializeConnection();

    // Create the app
    app = await require('../../index').initializeApp();
});

describe('Techniques API', function () {
    it('GET /api/techniques returns an empty array of techniques', function (done) {
        request(app)
            .get('/api/techniques')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get an empty array
                    const techniques = res.body;
                    expect(techniques).toBeDefined();
                    expect(Array.isArray(techniques)).toBe(true);
                    expect(techniques.length).toBe(0);
                    done();
                }
            });
    });

    let techniqueId;
    it('POST /api/techniques creates a technique', function (done) {
        const timestamp = new Date().toISOString();
        object1.stix.created = timestamp;
        object1.stix.modified = timestamp;
        const body = object1;
        request(app)
            .post('/api/techniques')
            .send(body)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(201)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the created technique
                    const technique = res.body;
                    expect(technique).toBeDefined();
                    techniqueId = technique._id;
                    done();
                }
            });
    });

    it('GET /api/techniques returns the added technique', function (done) {
        request(app)
            .get('/api/techniques')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one technique in an array
                    const techniques = res.body;
                    expect(techniques).toBeDefined();
                    expect(Array.isArray(techniques)).toBe(true);
                    expect(techniques.length).toBe(1);
                    done();
                }
            });
    });

    it('GET /api/technique returns the added technique', function (done) {
        request(app)
            .get('/api/techniques/' + techniqueId)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the technique
                    object2 = res.body;
                    expect(object2).toBeDefined();
                    expect(object2._id).toBe(techniqueId);
                    done();
                }
            });
    });

    it('PUT /api/techniques creates a technique', function (done) {
        const timestamp = new Date().toISOString();
        object2.stix.description = 'Closest planet to the sun'
        object2.stix.modified = timestamp;
        const body = object2;
        request(app)
            .put('/api/techniques/' + techniqueId)
            .send(body)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the updated technique
                    const technique = res.body;
                    expect(technique).toBeDefined();
                    techniqueId = technique._id;
                    done();
                }
            });
    });

    it('DELETE /api/techniques deletes a technique', function (done) {
        request(app)
            .delete('/api/techniques/' + techniqueId)
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

    it('GET /api/techniques returns an empty array of techniques', function (done) {
        request(app)
            .get('/api/techniques')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get an empty array
                    const techniques = res.body;
                    expect(techniques).toBeDefined();
                    expect(Array.isArray(techniques)).toBe(true);
                    expect(techniques.length).toBe(0);
                    done();
                }
            });
    });
});

after(async function() {
    await database.closeConnection();
});
