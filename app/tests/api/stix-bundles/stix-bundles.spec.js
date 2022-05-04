const request = require('supertest');
const expect = require('expect');

const logger = require('../../../lib/logger');
logger.level = 'debug';

const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');
const login = require('../../shared/login');

const enterpriseDomain = 'enterprise-attack';
const mobileDomain = 'mobile-attack';
const icsDomain = 'attack-ics';

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
            external_references: [],
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
                    "object_ref": "attack-pattern--2bb2861b-fb40-42dc-b15f-1a6b64b6a39f",
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
                },
                {
                    "object_ref": "x-mitre-data-source--880b771b-17a8-4a6c-a259-9027c395010c",
                    "object_modified": "2020-04-12T15:44:47.629Z"
                },
                {
                    "object_ref": "x-mitre-data-source--3e396a50-dd74-45cf-b8a3-974ab80c9a3e",
                    "object_modified": "2020-04-12T15:44:47.629Z"
                },
                {
                    "object_ref": "x-mitre-data-component--47667153-e24d-4514-bdf4-5720312d9e7d",
                    "object_modified": "2020-04-12T15:44:47.629Z"
                },
                {
                    "object_ref": "x-mitre-data-component--f8b4833e-a6d4-4a05-ba6e-1936d4109d0a",
                    "object_modified": "2020-04-12T15:44:47.629Z"
                },
                {
                    "object_ref": "relationship--caa8928b-0bf6-45cd-8504-6c27b9cd96a8",
                    "object_modified": "2019-09-04T14:32:13.000Z"
                },
                {
                    "object_ref": "relationship--b0c6c76c-7699-447f-9f3f-573aec51431c",
                    "object_modified": "2019-09-04T14:32:13.000Z"
                },
                {
                    "object_ref": "relationship--e7f994c6-3e08-4aea-a30e-97cc6fe610c6",
                    "object_modified": "2019-09-04T14:32:13.000Z"
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
                { source_name: 'mitre-attack', external_id: 'T1' },
                { source_name: 'attack-pattern-1 source', description: 'this is a source description'}
            ],
            object_marking_refs: [ 'marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168' ],
            created_by_ref: "identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5",
            kill_chain_phases: [
                { kill_chain_name: 'kill-chain-name-1', phase_name: 'phase-1' }
            ],
            x_mitre_data_sources: [ 'Command: Command Execution', 'Network Traffic: Network Traffic Flow' ],
            x_mitre_detection: 'detection text',
            x_mitre_is_subtechnique: false,
            x_mitre_impact_type: [ 'impact-1' ],
            x_mitre_platforms: [ 'platform-1', 'platform-2' ],
            x_mitre_domains: [ enterpriseDomain ]
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
                { source_name: 'mitre-attack', external_id: 'T1' },
                { source_name: 'attack-pattern-1 source', description: 'this is a source description'}
            ],
            object_marking_refs: [ 'marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168' ],
            created_by_ref: "identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5",
            kill_chain_phases: [
                { kill_chain_name: 'kill-chain-name-1', phase_name: 'phase-1' }
            ],
            x_mitre_detection: 'detection text',
            x_mitre_is_subtechnique: false,
            x_mitre_impact_type: [ 'impact-1' ],
            x_mitre_platforms: [ 'platform-1', 'platform-2' ],
            x_mitre_domains: [ mobileDomain ]
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
                { source_name: 'mitre-attack', external_id: 'T1' },
                { source_name: 'attack-pattern-2 source', description: 'this is a source description 2'}
            ],
            object_marking_refs: [ 'marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168' ],
            created_by_ref: "identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5",
            kill_chain_phases: [
                { kill_chain_name: 'kill-chain-name-1', phase_name: 'phase-1' }
            ],
            x_mitre_data_sources: [ 'Operational Databases: Device Alarm', 'Network Traffic: Network Traffic Flow' ],
            x_mitre_detection: 'detection text',
            x_mitre_is_subtechnique: false,
            x_mitre_impact_type: [ 'impact-1' ],
            x_mitre_platforms: [ 'platform-1', 'platform-2' ],
            x_mitre_domains: [ icsDomain ]
        },
        {
            id: 'attack-pattern--2bb2861b-fb40-42dc-b15f-1a6b64b6a39f',
            created: '2019-02-03T16:56:41.200Z',
            modified: '2019-02-03T16:56:41.200Z',
            name: 'attack-pattern-4',
            x_mitre_version: '1.0',
            spec_version: '2.1',
            type: 'attack-pattern',
            description: 'This is another technique.',
            external_references: [
                { source_name: 'mitre-attack', external_id: 'T1' },
                { source_name: 'attack-pattern-2 source', description: 'this is a source description 2'}
            ],
            object_marking_refs: [ 'marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168' ],
            created_by_ref: "identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5",
            kill_chain_phases: [
                { kill_chain_name: 'kill-chain-name-1', phase_name: 'phase-1' }
            ],
            x_mitre_data_sources: [ 'Command: Command Execution', 'Operational Databases: Device Alarm', 'Network Traffic: Network Traffic Flow' ],
            x_mitre_detection: 'detection text',
            x_mitre_is_subtechnique: false,
            x_mitre_impact_type: [ 'impact-1' ],
            x_mitre_platforms: [ 'platform-1', 'platform-2' ],
            x_mitre_domains: [ enterpriseDomain, icsDomain ]
        },
        {
            id: "course-of-action--25dc1ce8-eb55-4333-ae30-a7cb4f5894a1",
            type: "course-of-action",
            created_by_ref: "identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5",
            name: "mitigation-1",
            description: "This is a mitigation",
            external_references: [
                { source_name: 'mitre-attack', external_id: 'M1' }
            ],
            object_marking_refs: [
                "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
            ],
            x_mitre_version: "1.0",
            modified: "2018-10-17T00:14:20.652Z",
            created: "2017-10-25T14:48:53.732Z",
            spec_version: "2.1",
            x_mitre_domains: [ enterpriseDomain ]
        },
        {
            id: "course-of-action--e944670c-d03a-4e93-a21c-b3d4c53ec4c9",
            type: "course-of-action",
            created_by_ref: "identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5",
            name: "mitigation-2",
            description: "This is a mitigation that isn't in the contents",
            external_references: [
                { source_name: 'mitre-attack', external_id: 'M1' }
            ],
            object_marking_refs: [
                "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
            ],
            x_mitre_version: "1.0",
            modified: "2018-10-17T00:14:20.652Z",
            created: "2017-10-25T14:48:53.732Z",
            spec_version: "2.1",
            x_mitre_domains: [ enterpriseDomain ],
            x_mitre_deprecated: true
        },
        {
            id: "malware--04227b24-7817-4de1-9050-b7b1b57f5866",
            type: "malware",
            created_by_ref: "identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5",
            name: "software-1",
            description: "This is a software with an alias",
            external_references: [
                { source_name: 'mitre-attack', external_id: 'S1' },
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
            x_mitre_domains: [ enterpriseDomain ],
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
            object_marking_refs: [ 'marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168' ],
            created_by_ref: "identity--6444f546-6900-4456-b3b1-015c88d70dab",
            object_refs: [ 'malware--04227b24-7817-4de1-9050-b7b1b57f5866' ],
            modified: "2020-04-12T15:44:47.629Z",
            created: "2019-10-22T00:14:20.652Z"
        },
        {
            type: 'x-mitre-data-source',
            id: 'x-mitre-data-source--880b771b-17a8-4a6c-a259-9027c395010c',
            name: 'Command',
            spec_version: '2.1',
            object_marking_refs: [ 'marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168' ],
            created_by_ref: "identity--6444f546-6900-4456-b3b1-015c88d70dab",
            modified: "2020-04-12T15:44:47.629Z",
            created: "2019-10-22T00:14:20.652Z",
            external_references: [
                {source_name: 'mitre-attack', external_id: 'DS1'}
            ],
        },
        {
            type: 'x-mitre-data-source',
            id: 'x-mitre-data-source--3e396a50-dd74-45cf-b8a3-974ab80c9a3e',
            name: 'Network Traffic',
            spec_version: '2.1',
            object_marking_refs: [ 'marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168' ],
            created_by_ref: "identity--6444f546-6900-4456-b3b1-015c88d70dab",
            modified: "2020-04-12T15:44:47.629Z",
            created: "2019-10-22T00:14:20.652Z",
            external_references: [
                {source_name: 'mitre-attack', external_id: 'DS1'}
            ],
        },
        {
            type: 'x-mitre-data-component',
            id: 'x-mitre-data-component--47667153-e24d-4514-bdf4-5720312d9e7d',
            name: 'Command Execution',
            spec_version: '2.1',
            x_mitre_data_source_ref: 'x-mitre-data-source--880b771b-17a8-4a6c-a259-9027c395010c',
            object_marking_refs: [ 'marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168' ],
            created_by_ref: "identity--6444f546-6900-4456-b3b1-015c88d70dab",
            modified: "2020-04-12T15:44:47.629Z",
            created: "2019-10-22T00:14:20.652Z"
        },
        {
            type: 'x-mitre-data-component',
            id: 'x-mitre-data-component--f8b4833e-a6d4-4a05-ba6e-1936d4109d0a',
            name: 'Network Traffic Flow',
            spec_version: '2.1',
            x_mitre_data_source_ref: 'x-mitre-data-source--3e396a50-dd74-45cf-b8a3-974ab80c9a3e',
            object_marking_refs: [ 'marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168' ],
            created_by_ref: "identity--6444f546-6900-4456-b3b1-015c88d70dab",
            modified: "2020-04-12T15:44:47.629Z",
            created: "2019-10-22T00:14:20.652Z"
        },
        {
            created_by_ref: "identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5",
            object_marking_refs: [
                "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
            ],
            source_ref: "x-mitre-data-component--47667153-e24d-4514-bdf4-5720312d9e7d",
            target_ref: "attack-pattern--2204c371-6100-4ae0-82f3-25c07c29772a",
            external_references: [],
            description: "Detects relationship",
            relationship_type: "detects",
            id: "relationship--caa8928b-0bf6-45cd-8504-6c27b9cd96a8",
            type: "relationship",
            modified: "2019-09-04T14:32:13.000Z",
            created: "2019-09-04T14:28:16.426Z",
            spec_version: "2.1"
        },
        {
            created_by_ref: "identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5",
            object_marking_refs: [
                "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
            ],
            source_ref: "x-mitre-data-component--47667153-e24d-4514-bdf4-5720312d9e7d",
            target_ref: "attack-pattern--2bb2861b-fb40-42dc-b15f-1a6b64b6a39f",
            external_references: [],
            description: "Detects relationship",
            relationship_type: "detects",
            id: "relationship--e7f994c6-3e08-4aea-a30e-97cc6fe610c6",
            type: "relationship",
            modified: "2019-09-04T14:32:13.000Z",
            created: "2019-09-04T14:28:16.426Z",
            spec_version: "2.1"
        },
        {
            created_by_ref: "identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5",
            object_marking_refs: [
                "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
            ],
            source_ref: "x-mitre-data-component--f8b4833e-a6d4-4a05-ba6e-1936d4109d0a",
            target_ref: "attack-pattern--2204c371-6100-4ae0-82f3-25c07c29772a",
            external_references: [],
            description: "Test relationship",
            relationship_type: "detects",
            id: "relationship--b0c6c76c-7699-447f-9f3f-573aec51431c",
            type: "relationship",
            modified: "2019-09-04T14:32:13.000Z",
            created: "2019-09-04T14:28:16.426Z",
            spec_version: "2.1"
        }
    ]
};

describe('STIX Bundles Basic API', function () {
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

    it('POST /api/collection-bundles imports a collection bundle', function (done) {
        const body = initialObjectData;
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
                    console.log(JSON.stringify(collection.workspace.import_categories.errors, null, 2));
                    expect(collection).toBeDefined();
                    expect(collection.workspace.import_categories.additions.length).toBe(20);
                    expect(collection.workspace.import_categories.errors.length).toBe(0);
                    done();
                }
            });
    });

    it('GET /api/stix-bundles exports an empty STIX bundle', function (done) {
        request(app)
            .get('/api/stix-bundles?domain=not-a-domain')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
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

    it('GET /api/stix-bundles exports the STIX bundle for the enterprise domain', function (done) {
        request(app)
            .get(`/api/stix-bundles?domain=${ enterpriseDomain }&includeNotes=true`)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
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
                    // 4 primary objects, 4 relationship, 5 secondary object,
                    // 1 note, 1 identity, 1 marking definition
                    expect(stixBundle.objects.length).toBe(16);

                    done();
                }
            });
    });

    it('GET /api/stix-bundles exports the STIX bundle for the enterprise domain including deprecated objects', function (done) {
        request(app)
            .get(`/api/stix-bundles?domain=${ enterpriseDomain }&includeDeprecated=true&includeNotes=true`)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
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
                    // 5 primary objects, 4 relationship, 5 secondary object,
                    // 1 note, 1 identity, 1 marking definition
                    expect(stixBundle.objects.length).toBe(17);

                    done();
                }
            });
    });

    it('GET /api/stix-bundles exports the STIX bundle for the mobile domain', function (done) {
        request(app)
            .get(`/api/stix-bundles?domain=${ mobileDomain }`)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
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
                    // 1 primary objects, 1 identity, 1 marking definition
                    expect(stixBundle.objects.length).toBe(3);

                    done();
                }
            });
    });

    it('GET /api/stix-bundles exports the STIX bundle for the ics domain', function (done) {
        request(app)
            .get(`/api/stix-bundles?domain=${ icsDomain }`)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
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
                    // 2 primary objects, 1 relationship, 2 secondary object,
                    // 1 identity, 1 marking definition
                    expect(stixBundle.objects.length).toBe(7);

                    done();
                }
            });
    });

    after(async function() {
        await database.closeConnection();
    });
});
