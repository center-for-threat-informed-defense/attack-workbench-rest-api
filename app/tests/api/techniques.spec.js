const request = require('supertest');
const database = require('../../lib/database-in-memory')
const expect = require('expect');

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
        const body = {
            stix: {
                name: 'mercury',
                spec_version: '2.1',
                type: 'attack-pattern',
                created: timestamp,
                modified: timestamp
            }
        };
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
                    // We expect to get an empty array
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
                    const technique = res.body;
                    expect(technique).toBeDefined();
                    expect(technique._id).toBe(techniqueId);
                    done();
                }
            });
    });
});

after(async function() {
    await database.closeConnection();
});
