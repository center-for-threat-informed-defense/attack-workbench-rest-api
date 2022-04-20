const request = require('supertest');
const expect = require('expect');
const _ = require('lodash');
const semver = require('semver');

const config = require('../../../config/config');

const logger = require('../../../lib/logger');
logger.level = 'debug';

const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');
const login = require('../../shared/login');

const collectionId = 'x-mitre-collection--30ee11cf-0a05-4d9e-ab54-9b8563669647';
const collectionTimestamp = new Date().toISOString();

const currentAttackSpecVersion = config.app.attackSpecVersion;
const incrementedAttackSpecVersion = semver.inc(currentAttackSpecVersion, 'major');

const collectionBundleData = {
    type: 'bundle',
    id: 'bundle--0cde353c-ea5b-4668-9f68-971946609282',
    spec_version: '2.1',
    objects: [
        {
            id: collectionId,
            created: collectionTimestamp,
            modified: collectionTimestamp,
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
                    "object_ref": "attack-pattern--14fbfb6a-c4d9-4c3b-a7ef-f8df23e3b22b",
                    "object_modified": "2019-02-22T16:56:41.200Z",
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
                },
                {
                    "object_ref": "malware--04227b24-7817-4de1-9050-b7b1b57f5866",
                    "object_modified": "2020-03-30T18:17:52.697Z"
                },
                {
                    "object_ref": "intrusion-set--d69e568e-9ac8-4c08-b32c-d93b43ba9172",
                    "object_modified": "2020-03-30T19:25:56.012Z"
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
                { source_name: 'source-1', external_id: 's1' },
                { source_name: 'attack-pattern-1 source', description: 'this is a source description'}
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
                { source_name: 'source-1', external_id: 's1' },
                { source_name: 'attack-pattern-2 source', description: 'this is a source description 2'}
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
            id: 'attack-pattern--14fbfb6a-c4d9-4c3b-a7ef-f8df23e3b22b',
            created: '2019-02-22T16:56:41.200Z',
            modified: '2019-02-22T16:56:41.200Z',
            name: 'attack-pattern-2',
            x_mitre_version: '1.0',
            type: 'attack-pattern',
            description: 'This is technique that is missing a spec_version.',
            external_references: [
                { source_name: 'source-1', external_id: 's1' },
                { source_name: 'attack-pattern-2 source', description: 'this is a source description 2'}
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
        },
        {
            id: "malware--04227b24-7817-4de1-9050-b7b1b57f5866",
            type: "malware",
            created_by_ref: "identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5",
            name: "software-1",
            description: "This is a software with an alias",
            external_references: [
                { source_name: 'source-1', external_id: 's1' },
                { source_name: 'malware-1 source', description: 'this is a source description'},
                { source_name: 'xyzzy', description: '(Citation: Adventure 1975)'}
            ],
            object_marking_refs: [
                "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
            ],
            x_mitre_version: "1.0",
            modified: "2020-03-30T18:17:52.697Z",
            created: "2017-10-25T14:48:53.732Z",
            spec_version: "2.1",
            x_mitre_domains: [
                "domain-1"
            ],
            x_mitre_aliases: [
                "xyzzy"
            ],
        },
        {
            type: "intrusion-set",
            id: "intrusion-set--d69e568e-9ac8-4c08-b32c-d93b43ba9172",
            created_by_ref: "identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5",
            name: "group-1",
            description: "This is a group with an alias",
            object_marking_refs: [
                "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
            ],
            external_references: [
                { source_name: "source-2", external_id: "g1" },
                { source_name: "group source", description: "This is a group description" },
                { source_name: "group-xyzzy", description: "(Citation: Red 1999)", }
            ],
            aliases: [
                "group-xyzzy"
            ],
            modified: "2020-03-30T19:25:56.012Z",
            created: "2018-10-17T00:14:20.652Z",
            x_mitre_version: "1.0",
            spec_version: "2.1",
            x_mitre_domains: [
                "domain-1"
            ]
        }
    ]
};

const collectionId2a = 'x-mitre-collection--7f478133-ad3b-4c8d-97a3-a18ef61b7dee';
const collectionId2b = 'x-mitre-collection--1d9e41f3-c1ae-4677-85ff-f805cbc9fe74';
const collectionTimestamp2a = new Date().toISOString();
const collectionTimestamp2b = new Date().toISOString();

const collectionBundleData2 = {
    type: 'bundle',
    id: 'bundle--d288edaa-6289-40b5-80cd-080e1cd7eb18',
    spec_version: '2.1',
    objects: [
        {
            id: collectionId2a,
            created: collectionTimestamp2a,
            modified: collectionTimestamp2a,
            name: 'collection-2a',
            spec_version: '2.1',
            type: 'x-mitre-collection',
            description: 'This is a collection.',
            external_references: [
                {source_name: 'source-1', external_id: 's1'}
            ],
            object_marking_refs: ['marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168'],
            created_by_ref: "identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5",
            x_mitre_contents: []
        },
        {
            id: collectionId2b,
            created: collectionTimestamp2b,
            modified: collectionTimestamp2b,
            name: 'collection-2b',
            spec_version: '2.1',
            type: 'x-mitre-collection',
            description: 'This is a collection.',
            external_references: [
                {source_name: 'source-1', external_id: 's1'}
            ],
            object_marking_refs: ['marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168'],
            created_by_ref: "identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5",
            x_mitre_contents: []
        }
    ]
};

const collectionBundleData3 = {
    type: 'bundle',
    id: 'bundle--6a95e2a6-1be9-4cd8-8348-f6cbf6408343',
    spec_version: '2.1',
    objects: []
};

const collectionId4 = 'x-mitre-collection--987ae650-ec5d-4530-90ad-49e05347271e'
const collectionTimestamp4 = new Date().toISOString();

const collectionBundleData4 = {
    type: 'bundle',
    id: 'bundle--ad851e77-ea3c-454a-b2ba-a73c59d3c70f',
    spec_version: '2.1',
    objects: [
        {
            id: collectionId4,
            created: collectionTimestamp4,
            modified: collectionTimestamp4,
            name: 'collection-4',
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
                    "object_ref": "attack-pattern--fb4f094c-ad39-4dba-b459-5e314f6d6c8d",
                    "object_modified": "2020-03-30T14:03:43.761Z"
                }
            ]
        },
        {
            id: 'attack-pattern--fb4f094c-ad39-4dba-b459-5e314f6d6c8d',
            created: '2020-03-30T14:03:43.761Z',
            modified: '2020-03-30T14:03:43.761Z',
            name: 'attack-pattern-1',
            x_mitre_version: '1.0',
            spec_version: '2.1',
            type: 'attack-pattern',
            description: 'This is a technique.',
            external_references: [
                { source_name: 'source-1', external_id: 's1' },
                { source_name: 'attack-pattern-1 source', description: 'this is a source description'}
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
            id: 'attack-pattern--fb4f094c-ad39-4dba-b459-5e314f6d6c8d',
            created: '2020-03-30T14:03:43.761Z',
            modified: '2020-03-30T14:03:43.761Z',
            name: 'attack-pattern-1',
            x_mitre_version: '1.0',
            spec_version: '2.1',
            type: 'attack-pattern',
            description: 'This is a technique.',
            external_references: [
                { source_name: 'source-1', external_id: 's1' },
                { source_name: 'attack-pattern-1 source', description: 'this is a source description'}
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
    ]
};

const collectionId5 = 'x-mitre-collection--2a5ef1a2-effb-4951-a301-e9ed333cb4cb'
const collectionTimestamp5 = new Date().toISOString();

const collectionBundleData5 = {
    type: 'bundle',
    id: 'bundle--45bad6cc-a31b-418b-acf8-cd8ff3a5c2ec',
    objects: [
        {
            id: collectionId5,
            created: collectionTimestamp5,
            modified: collectionTimestamp5,
            name: 'collection-4',
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
                    "object_ref": "attack-pattern--44fc382e-0b71-4f5d-9110-fb2e35452d98",
                    "object_modified": "2021-03-30T14:03:43.761Z"
                }
            ]
        },
        {
            id: 'attack-pattern--44fc382e-0b71-4f5d-9110-fb2e35452d98',
            created: '2020-03-30T14:03:43.761Z',
            modified: '2021-03-30T14:03:43.761Z',
            name: 'attack-pattern-5',
            x_mitre_version: '1.0',
            spec_version: '2.1',
            x_mitre_attack_spec_version: incrementedAttackSpecVersion,
            type: 'attack-pattern',
            description: 'This is a technique.',
            external_references: [
                { source_name: 'source-1', external_id: 's1' },
                { source_name: 'attack-pattern-1 source', description: 'this is a source description'}
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
    ]
};

describe('Collection Bundles Basic API', function () {
    let app;
    let passportCookie;

    before(async function() {
        // Establish the database connection
        // Use an in-memory database that we spin up for the test
        await database.initializeConnection();

        // Check for a valid database configuration
        await databaseConfiguration.checkSystemConfiguration();

        // Initialize the express app
        app = await require('../../../index').initializeApp();

        // Log into the app
        passportCookie = await login.loginAnonymous(app);
    });

    it('POST /api/collection-bundles does not import an empty collection bundle', function (done) {
        const body = {};
        request(app)
            .post('/api/collection-bundles')
            .send(body)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(400)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    done();
                }
            });
    });

    it('POST /api/collection-bundles does not import a collection bundle with multiple x-mitre-collection objects', function (done) {
        const body = collectionBundleData2;
        request(app)
            .post('/api/collection-bundles')
            .send(body)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(400)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    const errorResult = res.body;
                    expect(errorResult.bundleErrors.moreThanOneCollection).toBe(true);

                    done();
                }
            });
    });

    it('POST /api/collection-bundles does not import a collection bundle with zero x-mitre-collection objects', function (done) {
        const body = collectionBundleData3;
        request(app)
            .post('/api/collection-bundles')
            .send(body)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(400)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    const errorResult = res.body;
                    expect(errorResult.bundleErrors.noCollection).toBe(true);

                    done();
                }
            });
    });

    it('POST /api/collection-bundles does not import a collection bundle with duplicate objects in the bundle', function (done) {
        const body = collectionBundleData4;
        request(app)
            .post('/api/collection-bundles')
            .send(body)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(400)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    const errorResult = res.body;
                    expect(errorResult.objectErrors.summary.duplicateObjectInBundleCount).toBe(1);

                    done();
                }
            });
    });

    it('POST /api/collection-bundles does not import a collection bundle with an attack spec version violation', function (done) {
        const body = collectionBundleData5;
        request(app)
            .post('/api/collection-bundles')
            .send(body)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(400)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    const errorResult = res.body;
                    expect(errorResult.objectErrors.summary.invalidAttackSpecVersionCount).toBe(1);

                    done();
                }
            });
    });

    it('POST /api/collection-bundles DOES import a collection bundle with an attack spec version violation if forceImport is set', function (done) {
        const body = collectionBundleData5;
        request(app)
            .post('/api/collection-bundles?forceImport=attack-spec-version-violations')
            .send(body)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(201)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    done();
                }
            });
    });

    it('POST /api/collection-bundles previews the import of a collection bundle (checkOnly)', function (done) {
        const body = collectionBundleData;
        request(app)
            .post('/api/collection-bundles?checkOnly=true')
            .send(body)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(201)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    // We expect to get the created collection object
                    const collection = res.body;
                    expect(collection).toBeDefined();
                    expect(collection.workspace.import_categories.additions.length).toBe(7);
                    expect(collection.workspace.import_categories.errors.length).toBe(3);
                    done();
                }
            });
    });

    let collection1;
    it('POST /api/collection-bundles previews the import of a collection bundle (previewOnly)', function (done) {
        const body = collectionBundleData;
        request(app)
            .post('/api/collection-bundles?previewOnly=true')
            .send(body)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(201)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    // We expect to get the created collection object
                    const collection = res.body;
                    expect(collection).toBeDefined();
                    expect(collection.workspace.import_categories.additions.length).toBe(7);
                    expect(collection.workspace.import_categories.errors.length).toBe(3);
                    done();
                }
            });
    });

    it('POST /api/collection-bundles imports a collection bundle', function (done) {
        const body = collectionBundleData;
        request(app)
            .post('/api/collection-bundles')
            .send(body)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(201)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    // We expect to get the created collection object
                    collection1 = res.body;
                    expect(collection1).toBeDefined();
                    expect(collection1.workspace.import_categories.additions.length).toBe(7);
                    expect(collection1.workspace.import_categories.errors.length).toBe(4);
                    done();
                }
            });
    });

    it('POST /api/collection-bundles does not show a successful preview with a duplicate collection bundle', function (done) {
        const body = collectionBundleData;
        request(app)
            .post('/api/collection-bundles?checkOnly=true')
            .send(body)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
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
        const body = collectionBundleData;
        request(app)
            .post('/api/collection-bundles')
            .send(body)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(400)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    done();
                }
            });
    });

    it('POST /api/collection-bundles DOES import a duplicate collection bundle if forceImport is set', function (done) {
        const body = collectionBundleData;
        request(app)
            .post('/api/collection-bundles?forceImport=duplicate-collection')
            .send(body)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(201)
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
        const updatedCollection = _.cloneDeep(collectionBundleData);
        updatedCollection.objects[0].modified = updateTimestamp;
        updatedCollection.objects[0].x_mitre_contents[0].object_modified = updateTimestamp;
        updatedCollection.objects[1].modified = updateTimestamp;
        updatedCollection.objects[1].x_mitre_version = '1.1';

        const body = updatedCollection;
        request(app)
            .post('/api/collection-bundles')
            .send(body)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
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
                    expect(collection2.workspace.import_categories.duplicates.length).toBe(5);
                    expect(collection2.workspace.import_categories.errors.length).toBe(4);
                    done();
                }
            });
    });

    it('GET /api/references returns the malware added reference', function (done) {
        request(app)
            .get('/api/references?sourceName=' + encodeURIComponent('malware-1 source'))
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one reference in an array
                    const references = res.body;
                    expect(references).toBeDefined();
                    expect(Array.isArray(references)).toBe(true);
                    expect(references.length).toBe(1);

                    done();
                }
            });
    });

    it('GET /api/references does not return the malware alias', function (done) {
        request(app)
            .get('/api/references?sourceName=' + encodeURIComponent('xyzzy'))
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get zero references in an array
                    const references = res.body;
                    expect(references).toBeDefined();
                    expect(Array.isArray(references)).toBe(true);
                    expect(references.length).toBe(0);

                    done();
                }
            });
    });

    it('GET /api/references returns the group added reference', function (done) {
        request(app)
            .get('/api/references?sourceName=' + encodeURIComponent('group source'))
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one reference in an array
                    const references = res.body;
                    expect(references).toBeDefined();
                    expect(Array.isArray(references)).toBe(true);
                    expect(references.length).toBe(1);

                    done();
                }
            });
    });

    it('GET /api/references does not return the group alias', function (done) {
        request(app)
            .get('/api/references?sourceName=' + encodeURIComponent('group-xyzzy'))
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get zero references in an array
                    const references = res.body;
                    expect(references).toBeDefined();
                    expect(Array.isArray(references)).toBe(true);
                    expect(references.length).toBe(0);

                    done();
                }
            });
    });

    it('GET /api/collection-bundles does not export the collection bundle with a bad id', function (done) {
        request(app)
            .get('/api/collection-bundles?collectionId=not-an-id')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(404)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    done();
                }
            });
    });

    it('GET /api/collection-bundles previews the export of the collection bundle', function (done) {
        request(app)
            .get(`/api/collection-bundles?previewOnly=true&collectionId=x-mitre-collection--30ee11cf-0a05-4d9e-ab54-9b8563669647`)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the exported collection bundle
                    const collectionBundle = res.body;
                    expect(collectionBundle).toBeDefined();
                    expect(Array.isArray(collectionBundle.objects)).toBe(true);
                    expect(collectionBundle.objects.length).toBe(6);

                    done();
                }
            });
    });

    it('GET /api/collection-bundles exports the collection bundle', function (done) {
        request(app)
            .get(`/api/collection-bundles?collectionId=${ collectionId }`)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the exported collection bundle
                    const collectionBundle = res.body;
                    expect(collectionBundle).toBeDefined();
                    expect(Array.isArray(collectionBundle.objects)).toBe(true);
                    expect(collectionBundle.objects.length).toBe(6);

                    done();
                }
            });
    });

    let exportedCollectionBundle;
    it('GET /api/collection-bundles exports the collection bundle with id and modified', function (done) {
        request(app)
            .get(`/api/collection-bundles?collectionId=${ collectionId }&collectionModified=${ encodeURIComponent(collectionTimestamp) }`)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the exported collection bundle
                    exportedCollectionBundle = res.body;
                    expect(exportedCollectionBundle).toBeDefined();
                    expect(Array.isArray(exportedCollectionBundle.objects)).toBe(true);
                    expect(exportedCollectionBundle.objects.length).toBe(6);

                    done();
                }
            });
    });

    it('POST /api/collection-bundles imports the previously exported collection bundle', function (done) {
        // Update the exported collection bundle so it isn't a duplicate
        const updateTimestamp = new Date().toISOString();
        const updatedCollection = _.cloneDeep(exportedCollectionBundle);
        updatedCollection.objects[0].modified = updateTimestamp;
        updatedCollection.objects[0].x_mitre_contents[0].object_modified = updateTimestamp;
        updatedCollection.objects[1].modified = updateTimestamp;
        updatedCollection.objects[1].x_mitre_version = '1.1';

        const body = updatedCollection;
        request(app)
            .post('/api/collection-bundles')
            .send(body)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(201)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    // We expect to get the created collection object
                    const collection = res.body;
                    expect(collection).toBeDefined();
                    done();
                }
            });
    });

    after(async function() {
        await database.closeConnection();
    });
});
