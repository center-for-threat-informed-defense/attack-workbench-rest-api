const request = require('supertest');
const expect = require('expect');

const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');
const AttackObject = require('../../../models/attack-object-model');
const login = require('../../shared/login');

const logger = require('../../../lib/logger');
logger.level = 'debug';

// modified and created properties will be set before calling REST API
// stix.id property will be created by REST API
const collectionData = {
    workspace: {
        imported: new Date().toISOString(),
        import_categories: {
            additions: [],
            changes: [],
            minor_changes: [],
            revocations: [],
            deprecations: [],
            supersedes_user_edits: [],
            supersedes_collection_changes: [],
            duplicates: [],
            out_of_date: [],
            errors: []
        }
    },
    stix: {
        id: 'x-mitre-collection--30ee11cf-0a05-4d9e-ab54-9b8563669647',
        name: 'collection-1',
        spec_version: '2.1',
        type: 'x-mitre-collection',
        description: 'This is a collection.',
        external_references: [
            { source_name: 'source-1', external_id: 's1' }
        ],
        object_marking_refs: [ 'marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168' ],
        created_by_ref: "identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5",
        x_mitre_contents: []
    }
};

const groupData = {
    workspace: {
        workflow: {
            state: 'work-in-progress'
        }
    },
    stix: {
        name: 'intrusion-set-1',
        spec_version: '2.1',
        type: 'intrusion-set',
        description: 'This is a group.',
        external_references: [
            { source_name: 'mitre-attack', external_id: 'G1111', url: 'https://attack.mitre.org/groups/G1111' },
            { source_name: 'source-1', external_id: 's1' }
        ],
        object_marking_refs: [ 'marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168' ],
        created_by_ref: "identity--6444f546-6900-4456-b3b1-015c88d70dab"
    }
};

const identityData = {
    workspace: {
        workflow: {
            state: 'work-in-progress'
        }
    },
    stix: {
        name: 'identity-1',
        identity_class: 'organization',
        spec_version: '2.1',
        type: 'identity',
        description: 'This is an identity.',
        object_marking_refs: [ 'marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168' ]
    }
};

const mitigationData = {
    workspace: {
        workflow: {
            state: 'work-in-progress'
        }
    },
    stix: {
        name: 'course-of-action-1',
        spec_version: '2.1',
        type: 'course-of-action',
        description: 'This is a mitigation.',
        external_references: [
            { source_name: 'mitre-attack', external_id: 'T9999', url: 'https://attack.mitre.org/mitigations/T9999' },
            { source_name: 'source-1', external_id: 's1' }
        ],
        object_marking_refs: [ 'marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168' ],
        created_by_ref: "identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5",
        x_mitre_version: "1.1"
    }
};

const softwareData = {
    workspace: {
        workflow: {
            state: 'work-in-progress'
        }
    },
    stix: {
        name: 'software-1',
        spec_version: '2.1',
        type: 'malware',
        description: 'This is a malware type of software.',
        is_family: false,
        external_references: [
            { source_name: 'mitre-attack', external_id: 'S3333', url: 'https://attack.mitre.org/software/S3333' },
            { source_name: 'source-1', external_id: 's1' }
        ],
        object_marking_refs: [ 'marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168' ],
        created_by_ref: "identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5",
        x_mitre_version: "1.1",
        x_mitre_aliases: [
            "software-1"
        ],
        x_mitre_platforms: [
            "platform-1"
        ],
        x_mitre_contributors: [
            "contributor-1",
            "contributor-2"
        ],
        x_mitre_domains: [
            "mobile-attack"
        ]
    }
};

const relationshipData = {
    workspace: {
        workflow: {
            state: 'work-in-progress'
        }
    },
    stix: {
        spec_version: '2.1',
        type: 'relationship',
        relationship_type: 'uses',
        source_ref: '',
        target_ref: '',
        object_marking_refs: [ 'marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168' ],
        created_by_ref: "identity--6444f546-6900-4456-b3b1-015c88d70dab"
    }
};

const tacticData = {
    workspace: {
        workflow: {
            state: 'work-in-progress'
        }
    },
    stix: {
        name: 'x-mitre-tactic-1',
        spec_version: '2.1',
        type: 'x-mitre-tactic',
        description: 'This is a tactic.',
        external_references: [
            { source_name: 'mitre-attack', external_id: 'TA4444', url: 'https://attack.mitre.org/tactics/TA4444' },
            { source_name: 'source-1', external_id: 's1' }
        ],
        object_marking_refs: [ 'marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168' ],
        created_by_ref: "identity--6444f546-6900-4456-b3b1-015c88d70dab"
    }
};

const techniqueData = {
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

const markingDefinitionData = {
    workspace: {
        workflow: {
            state: 'work-in-progress'
        }
    },
    stix: {
        spec_version: '2.1',
        type: 'marking-definition',
        definition_type: 'statement',
        definition: { statement: 'This is a marking definition.' },
        created_by_ref: "identity--6444f546-6900-4456-b3b1-015c88d70dab"
    }
};

describe('ATT&CK Objects API', function () {
    let app;
    let passportCookie;

    before(async function() {
        // Establish the database connection
        // Use an in-memory database that we spin up for the test
        await database.initializeConnection();

        // Wait until the indexes are created
        await AttackObject.init();

        // Check for a valid database configuration
        await databaseConfiguration.checkSystemConfiguration();

        // Initialize the express app
        app = await require('../../../index').initializeApp();

        // Log into the app
        passportCookie = await login.loginAnonymous(app);
    });

    it('GET /api/attack-objects returns only the placeholder identity', function (done) {
        request(app)
            .get('/api/attack-objects')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get an array with the placeholder identity and the pre-defined TLP marking defintions
                    const attackObjects = res.body;
                    expect(attackObjects).toBeDefined();
                    expect(Array.isArray(attackObjects)).toBe(true);

                    const identities = attackObjects.filter(x => x.stix.type === 'identity');
                    expect(identities.length).toBe(1);

                    const markingDefinitions = attackObjects.filter(x => x.stix.type === 'marking-definition');
                    expect(markingDefinitions.length).toBe(4);

                    done();
                }
            });
    });

    it('POST /api/collections creates a collection', function (done) {
        const timestamp = new Date().toISOString();
        collectionData.stix.created = timestamp;
        collectionData.stix.modified = timestamp;
        const body = collectionData;
        request(app)
            .post('/api/collections')
            .send(body)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(201)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    // We expect to get the created collection
                    const collection = res.body;
                    expect(collection).toBeDefined();
                    done();
                }
            });
    });

    let group;
    it('POST /api/groups creates a group', function (done) {
        const timestamp = new Date().toISOString();
        groupData.stix.created = timestamp;
        groupData.stix.modified = timestamp;
        const body = groupData;
        request(app)
            .post('/api/groups')
            .send(body)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(201)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the created group
                    group = res.body;
                    expect(group).toBeDefined();

                    done();
                }
            });
    });

    it('POST /api/identities creates an identity', function (done) {
        const timestamp = new Date().toISOString();
        identityData.stix.created = timestamp;
        identityData.stix.modified = timestamp;
        const body = identityData;
        request(app)
            .post('/api/identities')
            .send(body)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(201)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the created identity
                    const identity = res.body;
                    expect(identity).toBeDefined();
                    done();
                }
            });
    });

    it('POST /api/marking-definitions creates a marking definition', function (done) {
        const timestamp = new Date().toISOString();
        markingDefinitionData.stix.created = timestamp;
        const body = markingDefinitionData;
        request(app)
            .post('/api/marking-definitions')
            .send(body)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(201)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the created marking definition
                    const markingDefinition = res.body;
                    expect(markingDefinition).toBeDefined();
                    done();
                }
            });
    });

    it('POST /api/mitigations creates a mitigation', function (done) {
        const timestamp = new Date().toISOString();
        mitigationData.stix.created = timestamp;
        mitigationData.stix.modified = timestamp;
        const body = mitigationData;
        request(app)
            .post('/api/mitigations')
            .send(body)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(201)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the created mitigation
                    const mitigation = res.body;
                    expect(mitigation).toBeDefined();
                    done();
                }
            });
    });

    let software;
    it('POST /api/software creates a software', function (done) {
        const timestamp = new Date().toISOString();
        softwareData.stix.created = timestamp;
        softwareData.stix.modified = timestamp;
        const body = softwareData;
        request(app)
            .post('/api/software')
            .send(body)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(201)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the created software
                    software = res.body;
                    expect(software).toBeDefined();
                    done();
                }
            });
    });

    it('POST /api/relationship creates a relationship from the group to the software', function (done) {
        const timestamp = new Date().toISOString();
        relationshipData.stix.created = timestamp;
        relationshipData.stix.modified = timestamp;
        relationshipData.stix.source_ref = group.stix.id;
        relationshipData.stix.target_ref = software.stix.id
        const body = relationshipData;
        request(app)
            .post('/api/relationships')
            .send(body)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(201)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the created software
                    const relationship = res.body;
                    expect(relationship).toBeDefined();
                    done();
                }
            });
    });

    it('POST /api/tactics creates a tactic', function (done) {
        const timestamp = new Date().toISOString();
        tacticData.stix.created = timestamp;
        tacticData.stix.modified = timestamp;
        const body = tacticData;
        request(app)
            .post('/api/tactics')
            .send(body)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(201)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the created tactic
                    const tactic = res.body;
                    expect(tactic).toBeDefined();
                    done();
                }
            });
    });

    it('POST /api/techniques creates a technique', function (done) {
        const timestamp = new Date().toISOString();
        techniqueData.stix.created = timestamp;
        techniqueData.stix.modified = timestamp;
        const body = techniqueData;
        request(app)
            .post('/api/techniques')
            .send(body)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
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

    it('GET /api/attack-objects returns the added ATT&CK objects', function (done) {
        request(app)
            .get('/api/attack-objects')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get ATT&CK objects in an array
                    const attackObjects = res.body;
                    expect(attackObjects).toBeDefined();
                    expect(Array.isArray(attackObjects)).toBe(true);
                    expect(attackObjects.length).toBe(14);
                    done();
                }
            });
    });

    it('GET /api/attack-objects returns zero objects with an ATT&CK ID that does not exist', function (done) {
        request(app)
            .get('/api/attack-objects?attackId=T1234')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get an empty array
                    const attackObjects = res.body;
                    expect(attackObjects).toBeDefined();
                    expect(Array.isArray(attackObjects)).toBe(true);
                    expect(attackObjects.length).toBe(0);
                    done();
                }
            });
    });

    it('GET /api/attack-objects returns the group with ATT&CK ID G1111', function (done) {
        request(app)
            .get('/api/attack-objects?attackId=G1111')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the matching group object
                    const attackObjects = res.body;
                    expect(attackObjects).toBeDefined();
                    expect(Array.isArray(attackObjects)).toBe(true);
                    expect(attackObjects.length).toBe(1);
                    const groupObject = attackObjects[0];
                    expect(groupObject.stix.name).toBe(groupData.stix.name);
                    done();
                }
            });
    });

    it('GET /api/attack-objects returns the software with ATT&CK ID S3333', function (done) {
        request(app)
            .get('/api/attack-objects?attackId=S3333')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the matching software object
                    const attackObjects = res.body;
                    expect(attackObjects).toBeDefined();
                    expect(Array.isArray(attackObjects)).toBe(true);
                    expect(attackObjects.length).toBe(1);
                    const softwareObject = attackObjects[0];
                    expect(softwareObject.stix.name).toBe(softwareData.stix.name);
                    expect(softwareObject.stix.x_mitre_version).toBe(softwareData.stix.x_mitre_version);
                    done();
                }
            });
    });

    it('GET /api/attack-objects returns the mitigation and the technique with ATT&CK ID T9999', function (done) {
        request(app)
            .get('/api/attack-objects?attackId=T9999')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the matching objects
                    const attackObjects = res.body;
                    expect(attackObjects).toBeDefined();
                    expect(Array.isArray(attackObjects)).toBe(true);
                    expect(attackObjects.length).toBe(2);
                    done();
                }
            });
    });

    it('GET /api/attack-objects uses the search parameter to return the tactic object', function (done) {
        request(app)
            .get('/api/attack-objects?search=tactic')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the matching objects
                    const attackObjects = res.body;
                    expect(attackObjects).toBeDefined();
                    expect(Array.isArray(attackObjects)).toBe(true);
                    expect(attackObjects.length).toBe(1);
                    expect(attackObjects[0].stix.type).toBe('x-mitre-tactic');
                    done();
                }
            });
    });

    after(async function() {
        await database.closeConnection();
    });
});

