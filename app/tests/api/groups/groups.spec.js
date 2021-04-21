const request = require('supertest');
const expect = require('expect');
const _ = require('lodash');

const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');
const Group = require('../../../models/group-model');

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
        name: 'intrusion-set-1',
        spec_version: '2.1',
        type: 'intrusion-set',
        description: 'This is a group. Blue.',
        external_references: [
            { source_name: 'source-1', external_id: 's1' }
        ],
        object_marking_refs: [ 'marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168' ],
        created_by_ref: "identity--6444f546-6900-4456-b3b1-015c88d70dab"
    }
};

describe('Groups API', function () {
    let app;

    before(async function() {
        // Establish the database connection
        // Use an in-memory database that we spin up for the test
        await database.initializeConnection();

        // Wait until the indexes are created
        await Group.init();

        // Check for a valid database configuration
        await databaseConfiguration.checkSystemConfiguration();

        // Initialize the express app
        app = await require('../../../index').initializeApp();
    });

    it('GET /api/groups returns an empty array of groups', function (done) {
        request(app)
            .get('/api/groups')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get an empty array
                    const groups = res.body;
                    expect(groups).toBeDefined();
                    expect(Array.isArray(groups)).toBe(true);
                    expect(groups.length).toBe(0);
                    done();
                }
            });
    });

    it('POST /api/groups does not create an empty group', function (done) {
        const body = { };
        request(app)
            .post('/api/groups')
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

    let group1;
    it('POST /api/groups creates a group', function (done) {
        const timestamp = new Date().toISOString();
        initialObjectData.stix.created = timestamp;
        initialObjectData.stix.modified = timestamp;
        const body = initialObjectData;
        request(app)
            .post('/api/groups')
            .send(body)
            .set('Accept', 'application/json')
            .expect(201)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the created group
                    group1 = res.body;
                    expect(group1).toBeDefined();
                    expect(group1.stix).toBeDefined();
                    expect(group1.stix.id).toBeDefined();
                    expect(group1.stix.created).toBeDefined();
                    expect(group1.stix.modified).toBeDefined();
                    done();
                }
            });
    });

    it('GET /api/groups returns the added group', function (done) {
        request(app)
            .get('/api/groups')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one group in an array
                    const groups = res.body;
                    expect(groups).toBeDefined();
                    expect(Array.isArray(groups)).toBe(true);
                    expect(groups.length).toBe(1);
                    done();
                }
            });
    });

    it('GET /api/groups/:id should not return a group when the id cannot be found', function (done) {
        request(app)
            .get('/api/groups/not-an-id')
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

    it('GET /api/groups/:id returns the added group', function (done) {
        request(app)
            .get('/api/groups/' + group1.stix.id)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one group in an array
                    const groups = res.body;
                    expect(groups).toBeDefined();
                    expect(Array.isArray(groups)).toBe(true);
                    expect(groups.length).toBe(1);

                    const group = groups[0];
                    expect(group).toBeDefined();
                    expect(group.stix).toBeDefined();
                    expect(group.stix.id).toBe(group1.stix.id);
                    expect(group.stix.type).toBe(group1.stix.type);
                    expect(group.stix.name).toBe(group1.stix.name);
                    expect(group.stix.description).toBe(group1.stix.description);
                    expect(group.stix.spec_version).toBe(group1.stix.spec_version);
                    expect(group.stix.object_marking_refs).toEqual(expect.arrayContaining(group1.stix.object_marking_refs));
                    expect(group.stix.created_by_ref).toBe(group1.stix.created_by_ref);

                    done();
                }
            });
    });

    it('PUT /api/groups updates a group', function (done) {
        const originalModified = group1.stix.modified;
        const timestamp = new Date().toISOString();
        group1.stix.modified = timestamp;
        group1.stix.description = 'This is an updated group. Blue.'
        const body = group1;
        request(app)
            .put('/api/groups/' + group1.stix.id + '/modified/' + originalModified)
            .send(body)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the updated group
                    const group = res.body;
                    expect(group).toBeDefined();
                    expect(group.stix.id).toBe(group1.stix.id);
                    expect(group.stix.modified).toBe(group1.stix.modified);
                    done();
                }
            });
    });

    it('POST /api/groups does not create a group with the same id and modified date', function (done) {
        const body = group1;
        request(app)
            .post('/api/groups')
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

    let group2;
    it('POST /api/groups should create a new version of a group with a duplicate stix.id but different stix.modified date', function (done) {
        group2 = _.cloneDeep(group1);
        group2._id = undefined;
        group2.__t = undefined;
        group2.__v = undefined;
        const timestamp = new Date().toISOString();
        group2.stix.modified = timestamp;
        group2.stix.description = 'This is a new version of a group. Green.';
        const body = group2;
        request(app)
            .post('/api/groups')
            .send(body)
            .set('Accept', 'application/json')
            .expect(201)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the created group
                    const group = res.body;
                    expect(group).toBeDefined();
                    done();
                }
            });
    });

    it('GET /api/groups returns the latest added group', function (done) {
        request(app)
            .get('/api/groups/' + group2.stix.id)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one group in an array
                    const groups = res.body;
                    expect(groups).toBeDefined();
                    expect(Array.isArray(groups)).toBe(true);
                    expect(groups.length).toBe(1);
                    const group = groups[0];
                    expect(group.stix.id).toBe(group2.stix.id);
                    expect(group.stix.modified).toBe(group2.stix.modified);
                    done();
                }
            });
    });

    it('GET /api/groups returns all added groups', function (done) {
        request(app)
            .get('/api/groups/' + group1.stix.id + '?versions=all')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get two groups in an array
                    const groups = res.body;
                    expect(groups).toBeDefined();
                    expect(Array.isArray(groups)).toBe(true);
                    expect(groups.length).toBe(2);
                    done();
                }
            });
    });

    it('GET /api/groups/:id/modified/:modified returns the first added group', function (done) {
        request(app)
            .get('/api/groups/' + group1.stix.id + '/modified/' + group1.stix.modified)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one group
                    const group = res.body;
                    expect(group).toBeDefined();
                    expect(group.stix).toBeDefined();
                    expect(group.stix.id).toBe(group1.stix.id);
                    expect(group.stix.modified).toBe(group1.stix.modified);
                    done();
                }
            });
    });

    it('GET /api/groups/:id/modified/:modified returns the second added group', function (done) {
        request(app)
            .get('/api/groups/' + group2.stix.id + '/modified/' + group2.stix.modified)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one group
                    const group = res.body;
                    expect(group).toBeDefined();
                    expect(group.stix).toBeDefined();
                    expect(group.stix.id).toBe(group2.stix.id);
                    expect(group.stix.modified).toBe(group2.stix.modified);
                    done();
                }
            });
    });

    let group3;
    it('POST /api/groups should create a new group with a different stix.id', function (done) {
        const group = _.cloneDeep(initialObjectData);
        group._id = undefined;
        group.__t = undefined;
        group.__v = undefined;
        group.stix.id = undefined;
        const timestamp = new Date().toISOString();
        group.stix.created = timestamp;
        group.stix.modified = timestamp;
        group.stix.name = 'Mr. Brown';
        group.stix.description = 'This is a new group. Red.';
        const body = group;
        request(app)
            .post('/api/groups')
            .send(body)
            .set('Accept', 'application/json')
            .expect(201)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the created group
                    group3 = res.body;
                    expect(group3).toBeDefined();
                    done();
                }
            });
    });

    it('GET /api/groups uses the search parameter to return the latest version of the group', function (done) {
        request(app)
            .get('/api/groups?search=green')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one group in an array
                    const groups = res.body;
                    expect(groups).toBeDefined();
                    expect(Array.isArray(groups)).toBe(true);
                    expect(groups.length).toBe(1);

                    // We expect it to be the latest version of the group
                    const group = groups[0];
                    expect(group).toBeDefined();
                    expect(group.stix).toBeDefined();
                    expect(group.stix.id).toBe(group2.stix.id);
                    expect(group.stix.modified).toBe(group2.stix.modified);
                    done();
                }
            });
    });

    it('GET /api/groups should not get the first version of the group when using the search parameter', function (done) {
        request(app)
            .get('/api/groups?search=blue')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get zero groups in an array
                    const groups = res.body;
                    expect(groups).toBeDefined();
                    expect(Array.isArray(groups)).toBe(true);
                    expect(groups.length).toBe(0);
                    done();
                }
            });
    });

    it('GET /api/groups uses the search parameter to return the group using the name property', function (done) {
        request(app)
            .get('/api/groups?search=brown')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one group in an array
                    const groups = res.body;
                    expect(groups).toBeDefined();
                    expect(Array.isArray(groups)).toBe(true);
                    expect(groups.length).toBe(1);

                    // We expect it to be the third group
                    const group = groups[0];
                    expect(group).toBeDefined();
                    expect(group.stix).toBeDefined();
                    expect(group.stix.id).toBe(group3.stix.id);
                    expect(group.stix.modified).toBe(group3.stix.modified);
                    done();
                }
            });
    });

    it('DELETE /api/groups deletes a group', function (done) {
        request(app)
            .delete('/api/groups/' + group1.stix.id + '/modified/' + group1.stix.modified)
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

    it('DELETE /api/groups should delete the second group', function (done) {
        request(app)
            .delete('/api/groups/' + group2.stix.id + '/modified/' + group2.stix.modified)
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

    it('DELETE /api/groups should delete the third group', function (done) {
        request(app)
            .delete('/api/groups/' + group3.stix.id + '/modified/' + group3.stix.modified)
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

    it('GET /api/groups returns an empty array of groups', function (done) {
        request(app)
            .get('/api/groups')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get an empty array
                    const groups = res.body;
                    expect(groups).toBeDefined();
                    expect(Array.isArray(groups)).toBe(true);
                    expect(groups.length).toBe(0);
                    done();
                }
            });
    });

    after(async function() {
        await database.closeConnection();
    });
});

