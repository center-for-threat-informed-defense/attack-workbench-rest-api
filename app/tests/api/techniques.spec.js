const request = require('supertest');
const database = require('../../lib/database-in-memory')
const expect = require('expect');

const logger = require('../../lib/logger');
logger.level = 'debug';

// modified and created properties will be set before calling REST API
// stix.id property will be created by REST API
const object1 = {
    workspace: {
        domains: [ 'domain-1']
    },
    stix: {
        name: 'attack-pattern-1',
        spec_version: '2.1',
        type: 'attack-pattern',
        external_references: [
            { source_name: 'source-1', external_id: 's1' }
        ],
        object_marking_refs: [ 'marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168' ],
        created_by_ref: "identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5",
        kill_chain_phases: [
            { kill_chain_name: 'kill-chain-name-1', phase_name: 'phase-1' }
        ],
        x_mitre_data_sources: [ 'data-source-1', 'data-source-2' ],
        x_mitre_detection: 'detection text',
        x_mitre_is_subtechnique: false,
        x_mitre_impact_type: [ 'impact-1' ],
        x_mitre_platforms: [ 'platform-1', 'platform-2' ]
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
            .expect(200)
            .expect('Content-Type', /json/)
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

    it('POST /api/techniques does not create an empty technique', function (done) {
        const body = { };
        request(app)
            .post('/api/techniques')
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

    let createdTechnique;
    it('POST /api/techniques creates a technique', function (done) {
        const timestamp = new Date().toISOString();
        object1.stix.created = timestamp;
        object1.stix.modified = timestamp;
        const body = object1;
        request(app)
            .post('/api/techniques')
            .send(body)
            .set('Accept', 'application/json')
            .expect(201)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the created technique
                    const technique = res.body;
                    expect(technique).toBeDefined();
                    createdTechnique = technique;
                    done();
                }
            });
    });

    it('GET /api/techniques returns the added technique', function (done) {
        request(app)
            .get('/api/techniques')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
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
            .get('/api/techniques/' + createdTechnique.stix.id)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the technique
                    object2 = res.body;
                    expect(object2).toBeDefined();
                    expect(object2.stix).toBeDefined();
                    expect(object2.stix.id).toBe(createdTechnique.stix.id);
                    expect(object2.stix.type).toBe(object1.stix.type);
                    expect(object2.stix.name).toBe(object1.stix.name);
                    expect(object2.stix.spec_version).toBe(object1.stix.spec_version);
                    expect(object2.stix.object_marking_refs).toEqual(expect.arrayContaining(object1.stix.object_marking_refs));
                    expect(object2.stix.created_by_ref).toBe(object1.stix.created_by_ref);
                    expect(object2.stix.x_mitre_data_sources).toEqual(expect.arrayContaining(object1.stix.x_mitre_data_sources));
                    expect(object2.stix.x_mitre_detection).toBe(object1.stix.x_mitre_detection);
                    expect(object2.stix.x_mitre_is_subtechnique).toBe(object1.stix.x_mitre_is_subtechnique);
                    expect(object2.stix.x_mitre_impact_type).toEqual(expect.arrayContaining(object1.stix.x_mitre_impact_type));
                    expect(object2.stix.x_mitre_platforms).toEqual(expect.arrayContaining(object1.stix.x_mitre_platforms));

                    expect(object2.stix.x_mitre_deprecated).not.toBeDefined();
                    expect(object2.stix.x_mitre_defense_bypassed).not.toBeDefined();
                    expect(object2.stix.x_mitre_permissions_required).not.toBeDefined();
                    expect(object2.stix.x_mitre_system_requirements).not.toBeDefined();
                    expect(object2.stix.x_mitre_tactic_types).not.toBeDefined();

                    done();
                }
            });
    });

    it('PUT /api/techniques updates a technique', function (done) {
        const timestamp = new Date().toISOString();
        object2.stix.description = 'Closest planet to the sun'
        const body = object2;
        request(app)
            .put('/api/techniques/' + createdTechnique.stix.id + '/modified/' + createdTechnique.stix.modified)
            .send(body)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the updated technique
                    const technique = res.body;
                    expect(technique).toBeDefined();
                    expect(technique.stix.id).toBe(createdTechnique.stix.id);
                    done();
                }
            });
    });

    it('POST /api/techniques does not create a technique with the same id and modified date', function (done) {
        const body = object2;
        request(app)
            .post('/api/techniques')
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

    it('POST /api/techniques should create a technique with a duplicate stix.id but different stix.modified date', function (done) {
        object2._id = undefined;
        object2.__t = undefined;
        object2.__v = undefined;
        const timestamp = new Date().toISOString();
        object2.stix.modified = timestamp;
        const body = object2;
        request(app)
            .post('/api/techniques')
            .send(body)
            .set('Accept', 'application/json')
            .expect(201)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the created technique
                    const technique = res.body;
                    expect(technique).toBeDefined();
                    done();
                }
            });
    });

    it('DELETE /api/techniques deletes a technique', function (done) {
        request(app)
            .delete('/api/techniques/' + createdTechnique.stix.id + '/modified/' + createdTechnique.stix.modified)
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

    it('DELETE /api/techniques should delete the second technique', function (done) {
        request(app)
            .delete('/api/techniques/' + object2.stix.id + '/modified/' + object2.stix.modified)
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
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get an empty array
                    const techniques = res.body;
                    console.log(techniques);
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
