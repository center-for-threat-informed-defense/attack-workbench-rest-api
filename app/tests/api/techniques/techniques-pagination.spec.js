const request = require('supertest');
const expect = require('expect');
const _ = require('lodash');

const logger = require('../../../lib/logger');
logger.level = 'debug';

const database = require('../../../lib/database-in-memory');

const techniquesService = require('../../../services/techniques-service');

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

const numberTechniques = 45;
function loadTechniques() {
    // Initialize the data
    for (let i = 0; i < numberTechniques; i++) {
        const data = _.cloneDeep(initialObjectData);
        data.stix.name = `attack-pattern-${ i }`;

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
    }
}

describe('Techniques Pagination API', function () {
    let app;

    before(async function() {
        // Establish the database connection
        // Use an in-memory database that we spin up for the test
        await database.initializeConnection();

        // Initialize the express app
        app = await require('../../../index').initializeApp();
    });

    it('GET /api/techniques return an empty page', function (done) {
        request(app)
            .get(`/api/techniques?offset=0&limit=10`)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    // We expect to get an array with one page of techniques
                    const techniques = res.body;
                    expect(techniques).toBeDefined();
                    expect(Array.isArray(techniques)).toBe(true);
                    expect(techniques.length).toBe(0);
                    done();
                }
            });
    });

    it('GET /api/techniques return an empty page with offset', function (done) {
        request(app)
            .get(`/api/techniques?offset=10&limit=10`)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    // We expect to get an array with one page of techniques
                    const techniques = res.body;
                    expect(techniques).toBeDefined();
                    expect(Array.isArray(techniques)).toBe(true);
                    expect(techniques.length).toBe(0);
                    done();
                }
            });
    });

    it('GET /api/techniques return an empty page with pagination data', function (done) {
        request(app)
            .get(`/api/techniques?offset=0&limit=10&includePagination=true`)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    // We expect to get an array with one page of techniques
                    const techniques = res.body.data;
                    const pagination = res.body.pagination;
                    expect(techniques).toBeDefined();
                    expect(Array.isArray(techniques)).toBe(true);
                    expect(techniques.length).toBe(0);
                    expect(pagination).toBeDefined();
                    expect(pagination.total).toBe(0);
                    expect(pagination.limit).toBe(10);
                    expect(pagination.offset).toBe(0);
                    done();
                }
            });
    });

    it('GET /api/techniques return an empty page with offset with pagination data', function (done) {
        request(app)
            .get(`/api/techniques?offset=10&limit=10&includePagination=true`)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    // We expect to get an array with one page of techniques
                    const techniques = res.body.data;
                    const pagination = res.body.pagination;
                    expect(techniques).toBeDefined();
                    expect(Array.isArray(techniques)).toBe(true);
                    expect(techniques.length).toBe(0);
                    expect(pagination).toBeDefined();
                    expect(pagination.total).toBe(0);
                    expect(pagination.limit).toBe(10);
                    expect(pagination.offset).toBe(10);
                    done();
                }
            });
    });

    it('GET /api/techniques return the array of preloaded techniques', function (done) {
        loadTechniques();
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
                    expect(techniques.length).toBe(numberTechniques);
                    done();
                }
            });
    });

    const pageSizeList = [5, 10, 20];
    const offset = 10;
    pageSizeList.forEach((function(pageSize) {
        it('GET /api/techniques return a page of preloaded techniques', function (done) {
            request(app)
                .get(`/api/techniques?offset=${ offset }&limit=${ pageSize }`)
                .set('Accept', 'application/json')
                .expect(200)
                .expect('Content-Type', /json/)
                .end(function (err, res) {
                    if (err) {
                        done(err);
                    } else {
                        // We expect to get an array with one page of techniques
                        const techniques = res.body;
                        expect(techniques).toBeDefined();
                        expect(Array.isArray(techniques)).toBe(true);
                        expect(techniques.length).toBe(pageSize);
                        done();
                    }
                });
        });

        it('GET /api/techniques return a page of preloaded techniques with pagination data', function (done) {
            request(app)
                .get(`/api/techniques?offset=${ offset }&limit=${ pageSize }&includePagination=true`)
                .set('Accept', 'application/json')
                .expect(200)
                .expect('Content-Type', /json/)
                .end(function (err, res) {
                    if (err) {
                        done(err);
                    } else {
                        // We expect to get an array with one page of techniques
                        const techniques = res.body.data;
                        const pagination = res.body.pagination;
                        expect(techniques).toBeDefined();
                        expect(Array.isArray(techniques)).toBe(true);
                        expect(techniques.length).toBe(pageSize);
                        expect(pagination).toBeDefined();
                        expect(pagination.total).toBe(numberTechniques);
                        expect(pagination.limit).toBe(pageSize);
                        expect(pagination.offset).toBe(offset);
                        done();
                    }
                });
        });
    }));

    it('GET /api/techniques return a partial page of preloaded techniques', function (done) {
        request(app)
            .get(`/api/techniques?offset=40&limit=20`)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    // We expect to get an array with one page of techniques
                    const techniques = res.body;
                    expect(techniques).toBeDefined();
                    expect(Array.isArray(techniques)).toBe(true);
                    expect(techniques.length).toBe(5);
                    done();
                }
            });
    });

    it('GET /api/techniques return a partial page of preloaded techniques with pagination data', function (done) {
        request(app)
            .get(`/api/techniques?offset=40&limit=20&includePagination=true`)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    // We expect to get an array with one page of techniques
                    const techniques = res.body.data;
                    const pagination = res.body.pagination;
                    expect(techniques).toBeDefined();
                    expect(Array.isArray(techniques)).toBe(true);
                    expect(techniques.length).toBe(5);
                    expect(pagination).toBeDefined();
                    expect(pagination.total).toBe(45);
                    expect(pagination.limit).toBe(20);
                    expect(pagination.offset).toBe(40);
                    done();
                }
            });
    });

    after(async function() {
        await database.closeConnection();
    });
});

