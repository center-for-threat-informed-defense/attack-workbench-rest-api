const request = require('supertest');
const expect = require('expect');
const _ = require('lodash');

const logger = require('../../../lib/logger');
logger.level = 'debug';

const database = require('../../../lib/database-in-memory')

// modified and created properties will be set before calling REST API
// stix.id property will be created by REST API
const initialObjectData = {
    workspace: {
        workflow: {
            state: 'work-in-progress'
        }
    },
    stix: {
        name: 'attack-pattern-1',
        spec_version: '2.1',
        type: 'attack-pattern',
        description: 'This is a technique.',
        external_references: [
            { source_name: 'mitre-attack', external_id: 'T9999', url: 'https://attack.mitre.org/techniques/T9999' },
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

describe('Techniques Basic API', function () {
    let app;

    before(async function() {
        // Initialize the express app
        app = await require('../../../index').initializeApp();

        // Establish the database connection
        // Use an in-memory database that we spin up for the test
        await database.initializeConnection();
    });

    it('GET /api/techniques returns an empty array of techniques', function (done) {
        request(app)
            .get('/api/techniques')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
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
        const body = {};
        request(app)
            .post('/api/techniques')
            .send(body)
            .set('Accept', 'application/json')
            .expect(400)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    done();
                }
            });
    });

    let technique1;
    it('POST /api/techniques creates a technique', function (done) {
        const timestamp = new Date().toISOString();
        initialObjectData.stix.created = timestamp;
        initialObjectData.stix.modified = timestamp;
        const body = initialObjectData;
        request(app)
            .post('/api/techniques')
            .send(body)
            .set('Accept', 'application/json')
            .expect(201)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    // We expect to get the created technique
                    technique1 = res.body;
                    expect(technique1).toBeDefined();
                    expect(technique1.stix).toBeDefined();
                    expect(technique1.stix.id).toBeDefined();
                    expect(technique1.stix.created).toBeDefined();
                    expect(technique1.stix.modified).toBeDefined();
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
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    // We expect to get one technique in an array
                    const techniques = res.body;
                    expect(techniques).toBeDefined();
                    expect(Array.isArray(techniques)).toBe(true);
                    expect(techniques.length).toBe(1);
                    done();
                }
            });
    });

    it('GET /api/techniques/:id should not return a technique when the id cannot be found', function (done) {
        request(app)
            .get('/api/techniques/not-an-id')
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

    it('GET /api/techniques/:id returns the added technique', function (done) {
        request(app)
            .get('/api/techniques/' + technique1.stix.id)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    // We expect to get one technique in an array
                    const techniques = res.body;
                    expect(techniques).toBeDefined();
                    expect(Array.isArray(techniques)).toBe(true);
                    expect(techniques.length).toBe(1);

                    const technique = techniques[0];
                    expect(technique).toBeDefined();
                    expect(technique.stix).toBeDefined();
                    expect(technique.stix.id).toBe(technique1.stix.id);
                    expect(technique.stix.type).toBe(technique1.stix.type);
                    expect(technique.stix.name).toBe(technique1.stix.name);
                    expect(technique.stix.description).toBe(technique1.stix.description);
                    expect(technique.stix.spec_version).toBe(technique1.stix.spec_version);
                    expect(technique.stix.object_marking_refs).toEqual(expect.arrayContaining(technique1.stix.object_marking_refs));
                    expect(technique.stix.created_by_ref).toBe(technique1.stix.created_by_ref);
                    expect(technique.stix.x_mitre_data_sources).toEqual(expect.arrayContaining(technique1.stix.x_mitre_data_sources));
                    expect(technique.stix.x_mitre_detection).toBe(technique1.stix.x_mitre_detection);
                    expect(technique.stix.x_mitre_is_subtechnique).toBe(technique1.stix.x_mitre_is_subtechnique);
                    expect(technique.stix.x_mitre_impact_type).toEqual(expect.arrayContaining(technique1.stix.x_mitre_impact_type));
                    expect(technique.stix.x_mitre_platforms).toEqual(expect.arrayContaining(technique1.stix.x_mitre_platforms));

                    expect(technique.stix.x_mitre_deprecated).not.toBeDefined();
                    expect(technique.stix.x_mitre_defense_bypassed).not.toBeDefined();
                    expect(technique.stix.x_mitre_permissions_required).not.toBeDefined();
                    expect(technique.stix.x_mitre_system_requirements).not.toBeDefined();
                    expect(technique.stix.x_mitre_tactic_types).not.toBeDefined();

                    done();
                }
            });
    });

    it('PUT /api/techniques updates a technique', function (done) {
        const originalModified = technique1.stix.modified;
        const timestamp = new Date().toISOString();
        technique1.stix.modified = timestamp;
        technique1.stix.description = 'This is an updated technique.'
        const body = technique1;
        request(app)
            .put('/api/techniques/' + technique1.stix.id + '/modified/' + originalModified)
            .send(body)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    // We expect to get the updated technique
                    const technique = res.body;
                    expect(technique).toBeDefined();
                    expect(technique.stix.id).toBe(technique1.stix.id);
                    expect(technique.stix.modified).toBe(technique1.stix.modified);
                    done();
                }
            });
    });

    it('POST /api/techniques does not create a technique with the same id and modified date', function (done) {
        const body = technique1;
        request(app)
            .post('/api/techniques')
            .send(body)
            .set('Accept', 'application/json')
            .expect(409)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    done();
                }
            });
    });

    let technique2;
    it('POST /api/techniques should create a new version of a technique with a duplicate stix.id but different stix.modified date', function (done) {
        technique2 = _.cloneDeep(technique1);
        technique2._id = undefined;
        technique2.__t = undefined;
        technique2.__v = undefined;
        const timestamp = new Date().toISOString();
        technique2.stix.modified = timestamp;
        const body = technique2;
        request(app)
            .post('/api/techniques')
            .send(body)
            .set('Accept', 'application/json')
            .expect(201)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    // We expect to get the created technique
                    const technique = res.body;
                    expect(technique).toBeDefined();
                    done();
                }
            });
    });

    it('GET /api/techniques returns the latest added technique', function (done) {
        request(app)
            .get('/api/techniques/' + technique2.stix.id)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    // We expect to get one technique in an array
                    const techniques = res.body;
                    expect(techniques).toBeDefined();
                    expect(Array.isArray(techniques)).toBe(true);
                    expect(techniques.length).toBe(1);
                    const technique = techniques[0];
                    expect(technique.stix.id).toBe(technique2.stix.id);
                    expect(technique.stix.modified).toBe(technique2.stix.modified);
                    done();
                }
            });
    });

    it('GET /api/techniques returns all added techniques', function (done) {
        request(app)
            .get('/api/techniques/' + technique1.stix.id + '?versions=all')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    // We expect to get two techniques in an array
                    const techniques = res.body;
                    expect(techniques).toBeDefined();
                    expect(Array.isArray(techniques)).toBe(true);
                    expect(techniques.length).toBe(2);
                    done();
                }
            });
    });

    it('GET /api/techniques/:id/modified/:modified returns the first added technique', function (done) {
        request(app)
            .get('/api/techniques/' + technique1.stix.id + '/modified/' + technique1.stix.modified)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    // We expect to get one technique in an array
                    const technique = res.body;
                    expect(technique).toBeDefined();
                    expect(technique.stix).toBeDefined();
                    expect(technique.stix.id).toBe(technique1.stix.id);
                    expect(technique.stix.modified).toBe(technique1.stix.modified);
                    done();
                }
            });
    });

    it('GET /api/techniques/:id/modified/:modified returns the second added technique', function (done) {
        request(app)
            .get('/api/techniques/' + technique2.stix.id + '/modified/' + technique2.stix.modified)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    // We expect to get one technique in an array
                    const technique = res.body;
                    expect(technique).toBeDefined();
                    expect(technique.stix).toBeDefined();
                    expect(technique.stix.id).toBe(technique2.stix.id);
                    expect(technique.stix.modified).toBe(technique2.stix.modified);
                    done();
                }
            });
    });

    it('DELETE /api/techniques deletes a technique', function (done) {
        request(app)
            .delete('/api/techniques/' + technique1.stix.id + '/modified/' + technique1.stix.modified)
            .expect(204)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    done();
                }
            });
    });

    it('DELETE /api/techniques should delete the second technique', function (done) {
        request(app)
            .delete('/api/techniques/' + technique2.stix.id + '/modified/' + technique2.stix.modified)
            .expect(204)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
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
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    // We expect to get an empty array
                    const techniques = res.body;
                    expect(techniques).toBeDefined();
                    expect(Array.isArray(techniques)).toBe(true);
                    expect(techniques.length).toBe(0);
                    done();
                }
            });
    });

    after(async function() {
        await database.closeConnection();
    });
});
