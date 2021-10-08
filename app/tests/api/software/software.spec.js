const request = require('supertest');
const expect = require('expect');
const _ = require('lodash');

const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');

const config = require('../../../config/config');

const logger = require('../../../lib/logger');
logger.level = 'debug';

// modified and created properties will be set before calling REST API
// stix.id property will be created by REST API
const initialObjectData = {
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
        is_family: true,
        external_references: [
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

// Software missing required property stix.name
const invalidMissingName = _.cloneDeep(initialObjectData);
invalidMissingName.stix.name = undefined;

// Software (malware) missing required property stix.is_family
const invalidMalwareMissingIsFamily = _.cloneDeep(initialObjectData);
delete invalidMalwareMissingIsFamily.stix.is_family;

// Software (tool) includes property stix.is_family
const invalidToolIncludesIsFamily = _.cloneDeep(initialObjectData);
invalidToolIncludesIsFamily.stix.type = 'tool';

describe('Software API', function () {
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

    it('GET /api/software returns an empty array of software', function (done) {
        request(app)
            .get('/api/software')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get an empty array
                    const software = res.body;
                    expect(software).toBeDefined();
                    expect(Array.isArray(software)).toBe(true);
                    expect(software.length).toBe(0);
                    done();
                }
            });
    });

    it('POST /api/software does not create an empty software', function (done) {
        const body = { };
        request(app)
            .post('/api/software')
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

    it('POST /api/software does not create a software missing the name property', function (done) {
        const timestamp = new Date().toISOString();
        invalidMissingName.stix.created = timestamp;
        invalidMissingName.stix.modified = timestamp;
        const body = invalidMissingName;
        request(app)
            .post('/api/software')
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

    it('POST /api/software does not create a software (tool) with the is_family property', function (done) {
        const timestamp = new Date().toISOString();
        invalidToolIncludesIsFamily.stix.created = timestamp;
        invalidToolIncludesIsFamily.stix.modified = timestamp;
        const body = invalidToolIncludesIsFamily;
        request(app)
            .post('/api/software')
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

    let software1;
    it('POST /api/software creates a software', function (done) {
        const timestamp = new Date().toISOString();
        initialObjectData.stix.created = timestamp;
        initialObjectData.stix.modified = timestamp;
        const body = initialObjectData;
        request(app)
            .post('/api/software')
            .send(body)
            .set('Accept', 'application/json')
            .expect(201)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the created software
                    software1 = res.body;
                    expect(software1).toBeDefined();
                    expect(software1.stix).toBeDefined();
                    expect(software1.stix.id).toBeDefined();
                    expect(software1.stix.created).toBeDefined();
                    expect(software1.stix.modified).toBeDefined();
                    expect(software1.stix.x_mitre_attack_spec_version).toBe(config.app.attackSpecVersion);

                    done();
                }
            });
    });

    it('GET /api/software returns the added software', function (done) {
        request(app)
            .get('/api/software')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one software in an array
                    const software = res.body;
                    expect(software).toBeDefined();
                    expect(Array.isArray(software)).toBe(true);
                    expect(software.length).toBe(1);
                    done();
                }
            });
    });

    it('GET /api/software/:id should not return a software when the id cannot be found', function (done) {
        request(app)
            .get('/api/software/not-an-id')
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

    it('GET /api/software/:id returns the added software', function (done) {
        request(app)
            .get('/api/software/' + software1.stix.id)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one software in an array
                    const softwareObjects = res.body;
                    expect(softwareObjects).toBeDefined();
                    expect(Array.isArray(softwareObjects)).toBe(true);
                    expect(softwareObjects.length).toBe(1);

                    const software= softwareObjects[0];
                    expect(software).toBeDefined();
                    expect(software.stix).toBeDefined();
                    expect(software.stix.id).toBe(software1.stix.id);
                    expect(software.stix.type).toBe(software1.stix.type);
                    expect(software.stix.name).toBe(software1.stix.name);
                    expect(software.stix.description).toBe(software1.stix.description);
                    expect(software.stix.is_family).toBe(software1.stix.is_family);
                    expect(software.stix.spec_version).toBe(software1.stix.spec_version);
                    expect(software.stix.object_marking_refs).toEqual(expect.arrayContaining(software1.stix.object_marking_refs));
                    expect(software.stix.created_by_ref).toBe(software1.stix.created_by_ref);
                    expect(software.stix.x_mitre_version).toBe(software1.stix.x_mitre_version);
                    expect(software.stix.x_mitre_aliases).toEqual(expect.arrayContaining(software1.stix.x_mitre_aliases));
                    expect(software.stix.x_mitre_platforms).toEqual(expect.arrayContaining(software1.stix.x_mitre_platforms));
                    expect(software.stix.x_mitre_contributors).toEqual(expect.arrayContaining(software1.stix.x_mitre_contributors));
                    expect(software.stix.x_mitre_attack_spec_version).toBe(software1.stix.x_mitre_attack_spec_version);

                    done();
                }
            });
    });

    it('PUT /api/software updates a software', function (done) {
        const originalModified = software1.stix.modified;
        const timestamp = new Date().toISOString();
        software1.stix.modified = timestamp;
        software1.stix.description = 'This is an updated software.'
        const body = software1;
        request(app)
            .put('/api/software/' + software1.stix.id + '/modified/' + originalModified)
            .send(body)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the updated software
                    const software = res.body;
                    expect(software).toBeDefined();
                    expect(software.stix.id).toBe(software1.stix.id);
                    expect(software.stix.modified).toBe(software1.stix.modified);
                    done();
                }
            });
    });

    it('POST /api/software does not create a software with the same id and modified date', function (done) {
        const body = software1;
        request(app)
            .post('/api/software')
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

    let software2;
    it('POST /api/software should create a new version of a software with a duplicate stix.id but different stix.modified date', function (done) {
        software2 = _.cloneDeep(software1);
        software2._id = undefined;
        software2.__t = undefined;
        software2.__v = undefined;
        const timestamp = new Date().toISOString();
        software2.stix.modified = timestamp;
        const body = software2;
        request(app)
            .post('/api/software')
            .send(body)
            .set('Accept', 'application/json')
            .expect(201)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the created software
                    const software = res.body;
                    expect(software).toBeDefined();
                    done();
                }
            });
    });

    it('GET /api/software returns the latest added software', function (done) {
        request(app)
            .get('/api/software/' + software2.stix.id)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one software in an array
                    const software = res.body;
                    expect(software).toBeDefined();
                    expect(Array.isArray(software)).toBe(true);
                    expect(software.length).toBe(1);
                    const softwre = software[0];
                    expect(softwre.stix.id).toBe(software2.stix.id);
                    expect(softwre.stix.modified).toBe(software2.stix.modified);
                    done();
                }
            });
    });

    it('GET /api/software returns all added software', function (done) {
        request(app)
            .get('/api/software/' + software1.stix.id + '?versions=all')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get two software in an array
                    const software = res.body;
                    expect(software).toBeDefined();
                    expect(Array.isArray(software)).toBe(true);
                    expect(software.length).toBe(2);
                    done();
                }
            });
    });

    it('GET /api/software/:id/modified/:modified returns the first added software', function (done) {
        request(app)
            .get('/api/software/' + software1.stix.id + '/modified/' + software1.stix.modified)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one software in an array
                    const software = res.body;
                    expect(software).toBeDefined();
                    expect(software.stix).toBeDefined();
                    expect(software.stix.id).toBe(software1.stix.id);
                    expect(software.stix.modified).toBe(software1.stix.modified);
                    done();
                }
            });
    });

    it('GET /api/software/:id/modified/:modified returns the second added software', function (done) {
        request(app)
            .get('/api/software/' + software2.stix.id + '/modified/' + software2.stix.modified)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one software in an array
                    const software = res.body;
                    expect(software).toBeDefined();
                    expect(software.stix).toBeDefined();
                    expect(software.stix.id).toBe(software2.stix.id);
                    expect(software.stix.modified).toBe(software2.stix.modified);
                    done();
                }
            });
    });

    it('DELETE /api/software deletes a software', function (done) {
        request(app)
            .delete('/api/software/' + software1.stix.id + '/modified/' + software1.stix.modified)
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

    it('DELETE /api/software should delete the second software', function (done) {
        request(app)
            .delete('/api/software/' + software2.stix.id + '/modified/' + software2.stix.modified)
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

    it('GET /api/software returns an empty array of software', function (done) {
        request(app)
            .get('/api/software')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get an empty array
                    const software = res.body;
                    expect(software).toBeDefined();
                    expect(Array.isArray(software)).toBe(true);
                    expect(software.length).toBe(0);
                    done();
                }
            });
    });

    it('POST /api/software creates a software (malware) missing the is_family property using a default value', function (done) {
        const timestamp = new Date().toISOString();
        invalidMalwareMissingIsFamily.stix.created = timestamp;
        invalidMalwareMissingIsFamily.stix.modified = timestamp;
        const body = invalidMalwareMissingIsFamily;
        request(app)
            .post('/api/software')
            .send(body)
            .set('Accept', 'application/json')
            .expect(201)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the created software
                    const malware = res.body;
                    expect(malware).toBeDefined();
                    expect(malware.stix).toBeDefined();
                    expect(malware.stix.id).toBeDefined();
                    expect(malware.stix.created).toBeDefined();
                    expect(malware.stix.modified).toBeDefined();
                    expect(typeof malware.stix.is_family).toBe('boolean');
                    expect(malware.stix.is_family).toBe(true);
                    done();
                }
            });
    });

    after(async function() {
        await database.closeConnection();
    });
});

