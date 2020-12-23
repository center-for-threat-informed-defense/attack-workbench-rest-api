const request = require('supertest');
const expect = require('expect');
const _ = require('lodash');

const logger = require('../../../lib/logger');
logger.level = 'debug';

const database = require('../../../lib/database-in-memory')

const techniquesService = require('../../../services/techniques-service');

// modified and created properties will be set before calling REST API
// stix.id property will be created by REST API
const initialObjectData = {
    workspace: {
        domains: [ 'domain-1']
    },
    stix: {
        spec_version: '2.1',
        type: 'attack-pattern',
        description: 'This is a technique.',
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

function loadTechniques() {
    const techniques = [];
    // x_mitre_deprecated undefined
    const data1 = _.cloneDeep(initialObjectData);
    techniques.push(data1);

    // x_mitre_deprecated false
    const data2 = _.cloneDeep(initialObjectData);
    data2.stix.x_mitre_deprecated = false;
    data2.stix.revoked = false;
    data2.workspace.workflow = { state: 'work-in-progress' };
    techniques.push(data2);

    // x_mitre_deprecated true
    const data3 = _.cloneDeep(initialObjectData);
    data3.stix.x_mitre_deprecated = true;
    data3.stix.revoked = true;
    data2.workspace.workflow = { state: 'awaiting-review' };
    techniques.push(data3);

    // Initialize the data
    techniques.forEach(function(data) {
        data.stix.name = `attack-pattern-${ data.stix.x_mitre_deprecated }`;

        const timestamp = new Date().toISOString();
        data.stix.created = timestamp;
        data.stix.modified = timestamp;

        techniquesService.create(data, function(err, technique) {
            if (err) {
                if (err.message === techniquesService.errors.duplicateId) {
                    logger.warn("Duplicate stix.id and stix.modified");
                }
                else {
                    logger.error("Failed with error: " + err);
                }
            }
        })
    });
}

describe('Techniques Query API', function () {
    let app;

    before(async function() {
        // Initialize the express app
        app = await require('../../../index').initializeApp();

        // Establish the database connection
        // Use an in-memory database that we spin up for the test
        await database.initializeConnection();

        loadTechniques();
    });

    it('GET /api/techniques should return all of the preloaded techniques', function (done) {
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
                    // We expect to get all the techniques
                    const techniques = res.body;
                    expect(techniques).toBeDefined();
                    expect(Array.isArray(techniques)).toBe(true);
                    expect(techniques.length).toBe(3);
                    done();
                }
            });
    });

    it('GET /api/techniques should return techniques with x_mitre_deprecated not set to true (false or undefined)', function (done) {
        request(app)
            .get('/api/techniques?deprecated=false')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get all the techniques
                    const techniques = res.body;
                    expect(techniques).toBeDefined();
                    expect(Array.isArray(techniques)).toBe(true);
                    expect(techniques.length).toBe(2);
                    done();
                }
            });
    });

    it('GET /api/techniques should return techniques with x_mitre_deprecated set to true', function (done) {
        request(app)
            .get('/api/techniques?deprecated=true')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get all the techniques
                    const techniques = res.body;
                    expect(techniques).toBeDefined();
                    expect(Array.isArray(techniques)).toBe(true);
                    expect(techniques.length).toBe(1);
                    done();
                }
            });
    });

    it('GET /api/techniques should return techniques with revoked not set to true (false or undefined)', function (done) {
        request(app)
            .get('/api/techniques?revoked=false')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get all the techniques
                    const techniques = res.body;
                    expect(techniques).toBeDefined();
                    expect(Array.isArray(techniques)).toBe(true);
                    expect(techniques.length).toBe(2);
                    done();
                }
            });
    });

    it('GET /api/techniques should return techniques with x_mitre_deprecated set to true', function (done) {
        request(app)
            .get('/api/techniques?revoked=true')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get all the techniques
                    const techniques = res.body;
                    expect(techniques).toBeDefined();
                    expect(Array.isArray(techniques)).toBe(true);
                    expect(techniques.length).toBe(1);
                    done();
                }
            });
    });

    it('GET /api/techniques should return techniques with workflow.state set to awaiting-review', function (done) {
        request(app)
            .get('/api/techniques?state=awaiting-review')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get all the techniques
                    const techniques = res.body;
                    expect(techniques).toBeDefined();
                    expect(Array.isArray(techniques)).toBe(true);
                    expect(techniques.length).toBe(1);
                    done();
                }
            });
    });

    after(async function() {
        await database.closeConnection();
    });
});

