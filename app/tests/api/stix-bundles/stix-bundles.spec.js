const request = require('supertest');
const expect = require('expect');

const logger = require('../../../lib/logger');
logger.level = 'debug';

const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');

const domain = 'test-domain';

const collectionId = 'x-mitre-collection--30ee11cf-0a05-4d9e-ab54-9b8563669647';
const collectionTimestamp = new Date().toISOString();

const initialObjectData = {
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
                    "object_ref": "attack-pattern--1eaebf46-e361-4437-bc23-d5d65a3b92e3",
                    "object_modified": "2020-02-17T13:14:31.140Z",
                },
                {
                    "object_ref": "attack-pattern--82f04b1e-5371-4a6f-be06-411f0f43b483",
                    "object_modified": "2019-02-03T16:56:41.200Z"
                },
                {
                    "object_ref": "course-of-action--25dc1ce8-eb55-4333-ae30-a7cb4f5894a1",
                    "object_modified": "2018-10-17T00:14:20.652Z"
                },
                {
                    "object_ref": "course-of-action--e944670c-d03a-4e93-a21c-b3d4c53ec4c9",
                    "object_modified": "2018-10-17T00:14:20.652Z"
                },
                {
                    "object_ref": "malware--04227b24-7817-4de1-9050-b7b1b57f5866",
                    "object_modified": "2020-03-30T18:17:52.697Z"
                },
                {
                    "object_ref": "intrusion-set--8a831aaa-f3e0-47a3-bed8-a9ced744dd12",
                    "object_modified": "2020-06-03T20:22:40.401Z"
                },
                {
                    "object_ref": "relationship--12098dee-27b3-4d0b-a15a-6b5955ba8879",
                    "object_modified": "2019-09-04T14:32:13.000Z"
                },
                {
                    "object_ref": "intrusion-set--6b9ebeb5-20bf-48b0-afb7-988d769a2f01",
                    "object_modified": "2020-05-15T15:44:47.629Z"
                },
                {
                    "object_ref": "identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5",
                    "object_modified": "2017-06-01T00:00:00.000Z"
                },
                {
                    "object_ref": "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168",
                    "object_modified": "2017-06-01T00:00:00Z"
                },
                {
                    "object_ref": "note--6b9456275-20bf-48b0-afb7-988d769a2f99",
                    "object_modified": "2020-04-12T15:44:47.629Z"
                }
            ]
        },
        {
            id: "identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5",
            name: "The MITRE Corporation",
            identity_class: "organization",
            object_marking_refs: [
                "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
            ],
            type: "identity",
            modified: "2017-06-01T00:00:00.000Z",
            created: "2017-06-01T00:00:00.000Z",
            spec_version: '2.1'
        },
        {
            type: "marking-definition",
            id: "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168",
            created_by_ref: "identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5",
            created: "2017-06-01T00:00:00Z",
            definition_type: "statement",
            definition: {
                statement: "Copyright 2015-2021, The MITRE Corporation. MITRE ATT&CK and ATT&CK are registered trademarks of The MITRE Corporation."
            },
            spec_version: '2.1'
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
            x_mitre_platforms: [ 'platform-1', 'platform-2' ],
            x_mitre_domains: [ domain ]
        },
        {
            id: 'attack-pattern--1eaebf46-e361-4437-bc23-d5d65a3b92e3',
            created: '2020-02-12T18:55:24.728Z',
            modified: '2020-02-17T13:14:31.140Z',
            name: 'attack-pattern-2',
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
            x_mitre_deprecated: true,
            x_mitre_detection: 'detection text',
            x_mitre_is_subtechnique: false,
            x_mitre_impact_type: [ 'impact-1' ],
            x_mitre_platforms: [ 'platform-1', 'platform-2' ],
            x_mitre_domains: [ domain ]
        },
        {
            id: 'attack-pattern--82f04b1e-5371-4a6f-be06-411f0f43b483',
            created: '2019-02-03T16:56:41.200Z',
            modified: '2019-02-03T16:56:41.200Z',
            name: 'attack-pattern-3',
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
            x_mitre_platforms: [ 'platform-1', 'platform-2' ],
            x_mitre_domains: [ domain ]
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
            x_mitre_domains: [ domain ]
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
            x_mitre_domains: [ domain ]
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
            x_mitre_domains: [ domain ],
            x_mitre_aliases: [ "xyzzy" ]
        },
        {
            type: "intrusion-set",
            id: "intrusion-set--8a831aaa-f3e0-47a3-bed8-a9ced744dd12",
            created_by_ref: "identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5",
            name: "Dark Caracal",
            description: "[Dark Caracal](https://attack.mitre.org/groups/G0070) is threat group that has been attributed to the Lebanese General Directorate of General Security (GDGS) and has operated since at least 2012. (Citation: Lookout Dark Caracal Jan 2018)",
            object_marking_refs: [
                "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
            ],
            external_references: [
                {
                    source_name: "mitre-attack",
                    url: "https://attack.mitre.org/groups/G0070",
                    external_id: "G0070"
                },
                {
                    source_name: "Dark Caracal",
                    description: "(Citation: Lookout Dark Caracal Jan 2018)"
                },
                {
                    url: "https://info.lookout.com/rs/051-ESQ-475/images/Lookout_Dark-Caracal_srr_20180118_us_v.1.0.pdf",
                    description: "Blaich, A., et al. (2018, January 18). Dark Caracal: Cyber-espionage at a Global Scale. Retrieved April 11, 2018.",
                    source_name: "Lookout Dark Caracal Jan 2018"
                }
            ],
            aliases: [
                "Dark Caracal"
            ],
            modified: "2020-06-03T20:22:40.401Z",
            created: "2018-10-17T00:14:20.652Z",
            spec_version: "2.1",
            x_mitre_version: "1.2"
        },
        {
            created_by_ref: "identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5",
            object_marking_refs: [
                "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
            ],
            source_ref: "intrusion-set--8a831aaa-f3e0-47a3-bed8-a9ced744dd12",
            target_ref: "attack-pattern--2204c371-6100-4ae0-82f3-25c07c29772a",
            external_references: [],
            description: "Test relationship",
            relationship_type: "uses",
            id: "relationship--12098dee-27b3-4d0b-a15a-6b5955ba8879",
            type: "relationship",
            modified: "2019-09-04T14:32:13.000Z",
            created: "2019-09-04T14:28:16.426Z",
            spec_version: "2.1"
        },
        {
            external_references: [],
            object_marking_refs: [
                "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
            ],
            description: "This is a group that isn't in the domain",
            name: "Dark Hydra",
            created_by_ref: "identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5",
            id: "intrusion-set--6b9ebeb5-20bf-48b0-afb7-988d769a2f01",
            type: "intrusion-set",
            aliases: [
                "Hydra"
            ],
            modified: "2020-05-15T15:44:47.629Z",
            created: "2018-10-17T00:14:20.652Z",
            x_mitre_version: "1.2",
            spec_version: "2.1"
        },
        {
            type: 'note',
            id: 'note--6b9456275-20bf-48b0-afb7-988d769a2f99',
            spec_version: '2.1',
            abstract: 'This is the abstract for a note.',
            content: 'This is the content for a note.',
            authors: [
                'Author 1',
                'Author 2'
            ],
            external_references: [
                { source_name: 'source-1', external_id: 's1' }
            ],
            object_marking_refs: [ 'marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168' ],
            created_by_ref: "identity--6444f546-6900-4456-b3b1-015c88d70dab",
            object_refs: [ 'malware--04227b24-7817-4de1-9050-b7b1b57f5866' ],
            modified: "2020-04-12T15:44:47.629Z",
            created: "2019-10-22T00:14:20.652Z"
        }
    ]
};

describe('STIX Bundles Basic API', function () {
    let app;

    before(async function() {
        // Establish the database connection
        // Use an in-memory database that we spin up for the test
        await database.initializeConnection();

        // Check for a valid database configuration
        await databaseConfiguration.checkSystemConfiguration();

        // Initialize the express app
        app = await require('../../../index').initializeApp();
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
                    const collection = res.body;
                    console.log(JSON.stringify(collection.workspace.import_categories.errors, null, 2));
                    expect(collection).toBeDefined();
                    expect(collection.workspace.import_categories.additions.length).toBe(12);
                    expect(collection.workspace.import_categories.errors.length).toBe(0);
                    done();
                }
            });
    });

    it('GET /api/stix-bundles exports an empty STIX bundle', function (done) {
        request(app)
            .get('/api/stix-bundles?domain=not-a-domain')
            .set('Accept', 'application/json')
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    // We expect to get the exported STIX bundle
                    const stixBundle = res.body;
                    expect(stixBundle).toBeDefined();
                    expect(Array.isArray(stixBundle.objects)).toBe(true);
                    expect(stixBundle.objects.length).toBe(0);
                    done();
                }
            });
    });

    it('GET /api/stix-bundles exports the STIX bundle', function (done) {
        request(app)
            .get(`/api/stix-bundles?domain=${ domain }`)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the exported STIX bundle
                    const stixBundle = res.body;
                    expect(stixBundle).toBeDefined();
                    expect(Array.isArray(stixBundle.objects)).toBe(true);
                    // 5 primary objects, 1 relationship, 1 secondary object,
                    // 1 note, 1 identity, 1 marking definition
                    expect(stixBundle.objects.length).toBe(10);

                    done();
                }
            });
    });

    it('GET /api/stix-bundles exports the STIX bundle including deprecated objects', function (done) {
        request(app)
            .get(`/api/stix-bundles?domain=${ domain }&includeDeprecated=true`)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the exported STIX bundle
                    const stixBundle = res.body;
                    expect(stixBundle).toBeDefined();
                    expect(Array.isArray(stixBundle.objects)).toBe(true);
                    // 6 primary objects, 1 relationship, 1 secondary object,
                    // 1 note, 1 identity, 1 marking definition
                    expect(stixBundle.objects.length).toBe(11);

                    done();
                }
            });
    });

    after(async function() {
        await database.closeConnection();
    });
});
