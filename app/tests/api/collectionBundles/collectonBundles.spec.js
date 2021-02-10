const request = require('supertest');
const expect = require('expect');
const _ = require('lodash');

const logger = require('../../../lib/logger');
logger.level = 'debug';

const database = require('../../../lib/database-in-memory')

const timestamp = new Date().toISOString();
const initialObjectData = {
    type: 'bundle',
    id: 'bundle--0cde353c-ea5b-4668-9f68-971946609282',
    spec_version: '2.1',
    objects: [
        {
            id: 'x-mitre-collection--30ee11cf-0a05-4d9e-ab54-9b8563669647',
            created: timestamp,
            modified: timestamp,
            name: 'collection-1',
            spec_version: '2.1',
            type: 'x-mitre-collection',
            description: 'This is a collection.',
            external_references: [
                {source_name: 'source-1', external_id: 's1'}
            ],
            object_marking_refs: ['marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168'],
            created_by_ref: "identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5",
            x_mitre_contents: [
                {
                    "object_ref": "attack-pattern--2204c371-6100-4ae0-82f3-25c07c29772a",
                    "object_modified": "2020-03-30T14:03:43.761Z"
                },
                {
                    "object_ref": "attack-pattern--82f04b1e-5371-4a6f-be06-411f0f43b483",
                    "object_modified": "2019-02-03T16:56:41.200Z"
                },
                {
                    "object_ref": "not-a-type--a29c7d3a-3836-4219-b3db-ff946ea2251b",
                    "object_modified": "2020-05-30T14:03:43.761Z"
                },
                {
                    "object_ref": "course-of-action--25dc1ce8-eb55-4333-ae30-a7cb4f5894a1",
                    "object_modified": "2018-10-17T00:14:20.652Z"
                },
                {
                    "object_ref": "intrusion-set--bef4c620-0787-42a8-a96d-b7eb6e85917c",
                    "object_modified": "2020-10-06T23:32:21.793Z"
                }
            ]
        },
        {
            id: 'attack-pattern--2204c371-6100-4ae0-82f3-25c07c29772a',
            created: '2020-03-30T14:03:43.761Z',
            modified: '2020-03-30T14:03:43.761Z',
            name: 'attack-pattern-1',
            x_mitre_version: '1.0',
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
        },
        {
            id: 'attack-pattern--82f04b1e-5371-4a6f-be06-411f0f43b483',
            created: '2019-02-03T16:56:41.200Z',
            modified: '2019-02-03T16:56:41.200Z',
            name: 'attack-pattern-2',
            x_mitre_version: '1.0',
            spec_version: '2.1',
            type: 'attack-pattern',
            description: 'This is another technique.',
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
        },
        {
            id: 'not-a-type--a29c7d3a-3836-4219-b3db-ff946ea2251b',
            created: '2020-05-30T14:03:43.761Z',
            modified: '2020-05-30T14:03:43.761Z',
            name: 'not-a-type-1',
            x_mitre_version: '1.0',
            spec_version: '2.1',
            type: 'not-a-type',
            description: 'This is a not a known STIX type.'
        },
        {
            id: "course-of-action--25dc1ce8-eb55-4333-ae30-a7cb4f5894a1",
            type: "course-of-action",
            created_by_ref: "identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5",
            name: "mitigation-1",
            description: "This is a mitigation",
            external_references: [
                { source_name: 'source-1', external_id: 's1' }
            ],
            object_marking_refs: [
                "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
            ],
            x_mitre_version: "1.0",
            modified: "2018-10-17T00:14:20.652Z",
            created: "2017-10-25T14:48:53.732Z",
            spec_version: "2.1",
            x_mitre_domains: [
                "domain-1"
            ]
        },
        {
            id: "course-of-action--e944670c-d03a-4e93-a21c-b3d4c53ec4c9",
            type: "course-of-action",
            created_by_ref: "identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5",
            name: "mitigation-2",
            description: "This is a mitigation that isn't in the contents",
            external_references: [
                { source_name: 'source-1', external_id: 's1' }
            ],
            object_marking_refs: [
                "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
            ],
            x_mitre_version: "1.0",
            modified: "2018-10-17T00:14:20.652Z",
            created: "2017-10-25T14:48:53.732Z",
            spec_version: "2.1",
            x_mitre_domains: [
                "domain-1"
            ]
        }
    ]
};

describe('Collection Bundles Basic API', function () {
    let app;

    before(async function() {
        // Initialize the express app
        app = await require('../../../index').initializeApp();
        // Establish the database connection
        // Use an in-memory database that we spin up for the test
        await database.initializeConnection();
    });

    it('POST /api/collection-bundles does not import an empty collection bundle', function (done) {
        const body = {};
        request(app)
            .post('/api/collection-bundles')
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

    let collection1;
    it('POST /api/collection-bundles previews the import of a collection bundle', function (done) {
        const body = initialObjectData;
        request(app)
            .post('/api/collection-bundles?checkOnly=true')
            .send(body)
            .set('Accept', 'application/json')
            .expect(201)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    // We expect to get the created collection object
                    collection1 = res.body;
                    expect(collection1).toBeDefined();
                    expect(collection1.workspace.import_categories.additions.length).toBe(4);
                    expect(collection1.workspace.import_categories.errors.length).toBe(3);
                    done();
                }
            });
    });

    it('POST /api/collection-bundles imports a collection bundle', function (done) {
        const body = initialObjectData;
        request(app)
            .post('/api/collection-bundles')
            .send(body)
            .set('Accept', 'application/json')
            .expect(201)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    // We expect to get the created collection object
                    collection1 = res.body;
                    expect(collection1).toBeDefined();
                    expect(collection1.workspace.import_categories.additions.length).toBe(4);
                    expect(collection1.workspace.import_categories.errors.length).toBe(3);
                    done();
                }
            });
    });

    it('POST /api/collection-bundles does not show a successful preview with a duplicate collection bundle', function (done) {
        const body = initialObjectData;
        request(app)
            .post('/api/collection-bundles?checkOnly=true')
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

    it('POST /api/collection-bundles does not import a duplicate collection bundle', function (done) {
        const body = initialObjectData;
        request(app)
            .post('/api/collection-bundles')
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

    it('POST /api/collection-bundles imports an updated collection bundle', function (done) {
        const updateTimestamp = new Date().toISOString();
        const updatedCollection = _.cloneDeep(initialObjectData);
        updatedCollection.objects[0].modified = updateTimestamp;
        updatedCollection.objects[0].x_mitre_contents[0].object_modified = updateTimestamp;
        updatedCollection.objects[1].modified = updateTimestamp;
        updatedCollection.objects[1].x_mitre_version = '1.1';

        const body = updatedCollection;
        request(app)
            .post('/api/collection-bundles')
            .send(body)
            .set('Accept', 'application/json')
            .expect(201)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    // We expect to get the created collection object
                    const collection2 = res.body;
                    expect(collection2).toBeDefined();
                    expect(collection2.workspace.import_categories.changes.length).toBe(1);
                    expect(collection2.workspace.import_categories.duplicates.length).toBe(3);
                    expect(collection2.workspace.import_categories.errors.length).toBe(3);
                    done();
                }
            });
    });

    after(async function() {
        await database.closeConnection();
    });
});
