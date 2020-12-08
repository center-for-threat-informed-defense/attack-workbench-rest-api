const request = require('supertest');
const expect = require('expect');
const _ = require('lodash');

const app = require('../../index');

const techniquesService = require('../../services/techniques-service');

const logger = require('../../lib/logger');
logger.level = 'debug';

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

const numberTechniques = 40;
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
    }));
});

