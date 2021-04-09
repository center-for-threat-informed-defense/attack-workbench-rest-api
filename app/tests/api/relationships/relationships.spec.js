const request = require('supertest');
const expect = require('expect');
const _ = require('lodash');

const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');

const logger = require('../../../lib/logger');
logger.level = 'debug';

const sourceRef1 = 'malware--67e6d66b-1b82-4699-b47a-e2efb6268d14';
const targetRef1 = 'attack-pattern--7b211ac6-c815-4189-93a9-ab415deca926';

const sourceRef2 = 'malware--0b32ec39-ba61-4864-9ebe-b4b0b73caf9a';
const targetRef2 = 'attack-pattern--d63a3fb8-9452-4e9d-a60a-54be68d5998c';

const sourceRef3 = 'malware--a5528622-3a8a-4633-86ce-8cdaf8423858';
const targetRef3 = 'attack-pattern--0259baeb-9f63-4c69-bf10-eb038c390688';

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
        type: 'relationship',
        description: 'This is a relationship.',
        source_ref: sourceRef1,
        relationship_type: 'uses',
        target_ref: targetRef1,
        external_references: [
            { source_name: 'source-1', external_id: 's1' }
        ],
        object_marking_refs: [ 'marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168' ],
        created_by_ref: "identity--6444f546-6900-4456-b3b1-015c88d70dab"
    }
};

describe('Relationships API', function () {
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

    it('GET /api/relationships returns an empty array of relationships', function (done) {
        request(app)
            .get('/api/relationships')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get an empty array
                    const relationships = res.body;
                    expect(relationships).toBeDefined();
                    expect(Array.isArray(relationships)).toBe(true);
                    expect(relationships.length).toBe(0);
                    done();
                }
            });
    });

    it('POST /api/relationships does not create an empty relationship', function (done) {
        const body = { };
        request(app)
            .post('/api/relationships')
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

    let relationship1a;
    it('POST /api/relationships creates a relationship', function (done) {
        const timestamp = new Date().toISOString();
        initialObjectData.stix.created = timestamp;
        initialObjectData.stix.modified = timestamp;
        const body = initialObjectData;
        request(app)
            .post('/api/relationships')
            .send(body)
            .set('Accept', 'application/json')
            .expect(201)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the created relationship
                    relationship1a = res.body;
                    expect(relationship1a).toBeDefined();
                    expect(relationship1a.stix).toBeDefined();
                    expect(relationship1a.stix.id).toBeDefined();
                    expect(relationship1a.stix.created).toBeDefined();
                    expect(relationship1a.stix.modified).toBeDefined();
                    done();
                }
            });
    });

    it('GET /api/relationships returns the added relationship', function (done) {
        request(app)
            .get('/api/relationships')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one relationship in an array
                    const relationships = res.body;
                    expect(relationships).toBeDefined();
                    expect(Array.isArray(relationships)).toBe(true);
                    expect(relationships.length).toBe(1);
                    done();
                }
            });
    });

    it('GET /api/relationships/:id should not return a relationship when the id cannot be found', function (done) {
        request(app)
            .get('/api/relationships/not-an-id')
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

    it('GET /api/relationships/:id returns the added relationship', function (done) {
        request(app)
            .get('/api/relationships/' + relationship1a.stix.id)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one relationship in an array
                    const relationships = res.body;
                    expect(relationships).toBeDefined();
                    expect(Array.isArray(relationships)).toBe(true);
                    expect(relationships.length).toBe(1);

                    const relationship = relationships[0];
                    expect(relationship).toBeDefined();
                    expect(relationship.stix).toBeDefined();
                    expect(relationship.stix.id).toBe(relationship1a.stix.id);
                    expect(relationship.stix.type).toBe(relationship1a.stix.type);
                    expect(relationship.stix.name).toBe(relationship1a.stix.name);
                    expect(relationship.stix.description).toBe(relationship1a.stix.description);
                    expect(relationship.stix.spec_version).toBe(relationship1a.stix.spec_version);
                    expect(relationship.stix.object_marking_refs).toEqual(expect.arrayContaining(relationship1a.stix.object_marking_refs));
                    expect(relationship.stix.created_by_ref).toBe(relationship1a.stix.created_by_ref);

                    done();
                }
            });
    });

    it('PUT /api/relationships updates a relationship', function (done) {
        const originalModified = relationship1a.stix.modified;
        const timestamp = new Date().toISOString();
        relationship1a.stix.modified = timestamp;
        relationship1a.stix.description = 'This is an updated relationship.'
        const body = relationship1a;
        request(app)
            .put('/api/relationships/' + relationship1a.stix.id + '/modified/' + originalModified)
            .send(body)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the updated relationship
                    const relationship = res.body;
                    expect(relationship).toBeDefined();
                    expect(relationship.stix.id).toBe(relationship1a.stix.id);
                    expect(relationship.stix.modified).toBe(relationship1a.stix.modified);
                    done();
                }
            });
    });

    it('POST /api/relationships does not create a relationship with the same id and modified date', function (done) {
        const body = relationship1a;
        request(app)
            .post('/api/relationships')
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

    let relationship1b;
    it('POST /api/relationships should create a new version of a relationship with a duplicate stix.id but different stix.modified date', function (done) {
        relationship1b = _.cloneDeep(relationship1a);
        relationship1b._id = undefined;
        relationship1b.__t = undefined;
        relationship1b.__v = undefined;
        const timestamp = new Date().toISOString();
        relationship1b.stix.modified = timestamp;
        const body = relationship1b;
        request(app)
            .post('/api/relationships')
            .send(body)
            .set('Accept', 'application/json')
            .expect(201)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the created relationship
                    const relationship = res.body;
                    expect(relationship).toBeDefined();
                    done();
                }
            });
    });

    it('GET /api/relationships returns the latest added relationship', function (done) {
        request(app)
            .get('/api/relationships')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one relationship in an array
                    const relationships = res.body;
                    expect(relationships).toBeDefined();
                    expect(Array.isArray(relationships)).toBe(true);
                    expect(relationships.length).toBe(1);
                    const relationship = relationships[0];
                    expect(relationship.stix.id).toBe(relationship1b.stix.id);
                    expect(relationship.stix.modified).toBe(relationship1b.stix.modified);
                    done();
                }
            });
    });

    it('GET /api/relationships returns all added relationships', function (done) {
        request(app)
            .get('/api/relationships?versions=all')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get two relationships in an array
                    const relationships = res.body;
                    expect(relationships).toBeDefined();
                    expect(Array.isArray(relationships)).toBe(true);
                    expect(relationships.length).toBe(2);
                    done();
                }
            });
    });

    it('GET /api/relationships/:stixId returns the latest added relationship', function (done) {
        request(app)
            .get('/api/relationships/' + relationship1b.stix.id)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one relationship in an array
                    const relationships = res.body;
                    expect(relationships).toBeDefined();
                    expect(Array.isArray(relationships)).toBe(true);
                    expect(relationships.length).toBe(1);
                    const relationship = relationships[0];
                    expect(relationship.stix.id).toBe(relationship1b.stix.id);
                    expect(relationship.stix.modified).toBe(relationship1b.stix.modified);
                    done();
                }
            });
    });

    it('GET /api/relationships/:stixId returns all added relationships', function (done) {
        request(app)
            .get('/api/relationships/' + relationship1a.stix.id + '?versions=all')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get two relationships in an array
                    const relationships = res.body;
                    expect(relationships).toBeDefined();
                    expect(Array.isArray(relationships)).toBe(true);
                    expect(relationships.length).toBe(2);
                    done();
                }
            });
    });

    it('GET /api/relationships/:id/modified/:modified returns the first added relationship', function (done) {
        request(app)
            .get('/api/relationships/' + relationship1a.stix.id + '/modified/' + relationship1a.stix.modified)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one relationship in an array
                    const relationship = res.body;
                    expect(relationship).toBeDefined();
                    expect(relationship.stix).toBeDefined();
                    expect(relationship.stix.id).toBe(relationship1a.stix.id);
                    expect(relationship.stix.modified).toBe(relationship1a.stix.modified);
                    done();
                }
            });
    });

    it('GET /api/relationships/:id/modified/:modified returns the second added relationship', function (done) {
        request(app)
            .get('/api/relationships/' + relationship1b.stix.id + '/modified/' + relationship1b.stix.modified)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one relationship in an array
                    const relationship = res.body;
                    expect(relationship).toBeDefined();
                    expect(relationship.stix).toBeDefined();
                    expect(relationship.stix.id).toBe(relationship1b.stix.id);
                    expect(relationship.stix.modified).toBe(relationship1b.stix.modified);
                    done();
                }
            });
    });

    let relationship2;
    it('POST /api/relationships creates a relationship', function (done) {
        const timestamp = new Date().toISOString();
        initialObjectData.stix.created = timestamp;
        initialObjectData.stix.modified = timestamp;
        initialObjectData.stix.source_ref = sourceRef2;
        initialObjectData.stix.target_ref = targetRef2;
        const body = initialObjectData;
        request(app)
            .post('/api/relationships')
            .send(body)
            .set('Accept', 'application/json')
            .expect(201)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the created relationship
                    relationship2 = res.body;
                    expect(relationship2).toBeDefined();
                    done();
                }
            });
    });

    it('GET /api/relationships returns the (latest) relationship matching a source_ref', function (done) {
        request(app)
            .get('/api/relationships?sourceRef=' + sourceRef1)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one relationship in an array
                    const relationships = res.body;
                    expect(relationships).toBeDefined();
                    expect(Array.isArray(relationships)).toBe(true);
                    expect(relationships.length).toBe(1);
                    done();
                }
            });
    });

    it('GET /api/relationships returns the (latest) relationship matching a target_ref', function (done) {
        request(app)
            .get('/api/relationships?targetRef=' + targetRef1)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one relationship in an array
                    const relationships = res.body;
                    expect(relationships).toBeDefined();
                    expect(Array.isArray(relationships)).toBe(true);
                    expect(relationships.length).toBe(1);
                    done();
                }
            });
    });

    it('GET /api/relationships returns the (latest) relationship matching a sourceOrTargetRef', function (done) {
        request(app)
            .get('/api/relationships?sourceOrTargetRef=' + sourceRef1)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one relationship in an array
                    const relationships = res.body;
                    expect(relationships).toBeDefined();
                    expect(Array.isArray(relationships)).toBe(true);
                    expect(relationships.length).toBe(1);
                    done();
                }
            });
    });

    it('GET /api/relationships returns zero relationships for a non-matching source_ref', function (done) {
        request(app)
            .get('/api/relationships?sourceRef=' + sourceRef3)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get zero relationships in an array
                    const relationships = res.body;
                    expect(relationships).toBeDefined();
                    expect(Array.isArray(relationships)).toBe(true);
                    expect(relationships.length).toBe(0);
                    done();
                }
            });
    });

    it('GET /api/relationships returns zero relationships for a non-matching target_ref', function (done) {
        request(app)
            .get('/api/relationships?targetRef=' + targetRef3)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one relationship in an array
                    const relationships = res.body;
                    expect(relationships).toBeDefined();
                    expect(Array.isArray(relationships)).toBe(true);
                    expect(relationships.length).toBe(0);
                    done();
                }
            });
    });

    it('GET /api/relationships returns zero relationships for a non-matching sourceOrTargetRef', function (done) {
        request(app)
            .get('/api/relationships?sourceOrTargetRef=' + sourceRef3)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one relationship in an array
                    const relationships = res.body;
                    expect(relationships).toBeDefined();
                    expect(Array.isArray(relationships)).toBe(true);
                    expect(relationships.length).toBe(0);
                    done();
                }
            });
    });

    it('DELETE /api/relationships deletes a relationship', function (done) {
        request(app)
            .delete('/api/relationships/' + relationship1a.stix.id + '/modified/' + relationship1a.stix.modified)
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

    it('DELETE /api/relationships should delete the second relationship', function (done) {
        request(app)
            .delete('/api/relationships/' + relationship1b.stix.id + '/modified/' + relationship1b.stix.modified)
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

    it('DELETE /api/relationships should delete the third relationship', function (done) {
        request(app)
            .delete('/api/relationships/' + relationship2.stix.id + '/modified/' + relationship2.stix.modified)
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

    it('GET /api/relationships returns an empty array of relationships', function (done) {
        request(app)
            .get('/api/relationships')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get an empty array
                    const relationships = res.body;
                    expect(relationships).toBeDefined();
                    expect(Array.isArray(relationships)).toBe(true);
                    expect(relationships.length).toBe(0);
                    done();
                }
            });
    });

    after(async function() {
        await database.closeConnection();
    });
});

