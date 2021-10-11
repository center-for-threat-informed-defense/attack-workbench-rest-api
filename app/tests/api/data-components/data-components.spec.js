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
        name: 'data-component-1',
        spec_version: '2.1',
        type: 'x-mitre-data-component',
        description: 'This is a data component.',
        external_references: [
            { source_name: 'source-1', external_id: 's1' }
        ],
        object_marking_refs: [ 'marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168' ],
        created_by_ref: "identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5",
        x_mitre_version: "1.1",
        x_mitre_domains: [
            'enterprise-attack'
        ],
        x_mitre_modified_by_ref: 'identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5'
    }
};

describe('Data Components API', function () {
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

    it('GET /api/data-components returns an empty array of data components', function (done) {
        request(app)
            .get('/api/data-components')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get an empty array
                    const dataComponents = res.body;
                    expect(dataComponents).toBeDefined();
                    expect(Array.isArray(dataComponents)).toBe(true);
                    expect(dataComponents.length).toBe(0);
                    done();
                }
            });
    });

    it('POST /api/data-components does not create an empty data component', function (done) {
        const body = { };
        request(app)
            .post('/api/data-components')
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

    let dataComponent1;
    it('POST /api/data-components creates a data component', function (done) {
        const timestamp = new Date().toISOString();
        initialObjectData.stix.created = timestamp;
        initialObjectData.stix.modified = timestamp;
        const body = initialObjectData;
        request(app)
            .post('/api/data-components')
            .send(body)
            .set('Accept', 'application/json')
            .expect(201)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the created data component
                    dataComponent1 = res.body;
                    expect(dataComponent1).toBeDefined();
                    expect(dataComponent1.stix).toBeDefined();
                    expect(dataComponent1.stix.id).toBeDefined();
                    expect(dataComponent1.stix.created).toBeDefined();
                    expect(dataComponent1.stix.modified).toBeDefined();
                    expect(dataComponent1.stix.x_mitre_attack_spec_version).toBe(config.app.attackSpecVersion);

                    done();
                }
            });
    });

    it('GET /api/data-components returns the added data component', function (done) {
        request(app)
            .get('/api/data-components')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one data component in an array
                    const dataComponent = res.body;
                    expect(dataComponent).toBeDefined();
                    expect(Array.isArray(dataComponent)).toBe(true);
                    expect(dataComponent.length).toBe(1);
                    done();
                }
            });
    });

    it('GET /api/data-components/:id should not return a data component when the id cannot be found', function (done) {
        request(app)
            .get('/api/data-components/not-an-id')
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

    it('GET /api/data-components/:id returns the added data component', function (done) {
        request(app)
            .get('/api/data-components/' + dataComponent1.stix.id)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one data component in an array
                    const dataComponents = res.body;
                    expect(dataComponents).toBeDefined();
                    expect(Array.isArray(dataComponents)).toBe(true);
                    expect(dataComponents.length).toBe(1);

                    const dataComponent = dataComponents[0];
                    expect(dataComponent).toBeDefined();
                    expect(dataComponent.stix).toBeDefined();
                    expect(dataComponent.stix.id).toBe(dataComponent1.stix.id);
                    expect(dataComponent.stix.type).toBe(dataComponent1.stix.type);
                    expect(dataComponent.stix.name).toBe(dataComponent1.stix.name);
                    expect(dataComponent.stix.description).toBe(dataComponent1.stix.description);
                    expect(dataComponent.stix.spec_version).toBe(dataComponent1.stix.spec_version);
                    expect(dataComponent.stix.object_marking_refs).toEqual(expect.arrayContaining(dataComponent1.stix.object_marking_refs));
                    expect(dataComponent.stix.created_by_ref).toBe(dataComponent1.stix.created_by_ref);
                    expect(dataComponent.stix.x_mitre_version).toBe(dataComponent1.stix.x_mitre_version);
                    expect(dataComponent.stix.x_mitre_attack_spec_version).toBe(dataComponent1.stix.x_mitre_attack_spec_version);

                    done();
                }
            });
    });

    it('PUT /api/data-components updates a data component', function (done) {
        const originalModified = dataComponent1.stix.modified;
        const timestamp = new Date().toISOString();
        dataComponent1.stix.modified = timestamp;
        dataComponent1.stix.description = 'This is an updated data component.'
        const body = dataComponent1;
        request(app)
            .put('/api/data-components/' + dataComponent1.stix.id + '/modified/' + originalModified)
            .send(body)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the updated data component
                    const dataComponent = res.body;
                    expect(dataComponent).toBeDefined();
                    expect(dataComponent.stix.id).toBe(dataComponent1.stix.id);
                    expect(dataComponent.stix.modified).toBe(dataComponent1.stix.modified);
                    done();
                }
            });
    });

    it('POST /api/data-components does not create a data component with the same id and modified date', function (done) {
        const body = dataComponent1;
        request(app)
            .post('/api/data-components')
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

    let dataComponent2;
    it('POST /api/data-components should create a new version of a data component with a duplicate stix.id but different stix.modified date', function (done) {
        dataComponent2 = _.cloneDeep(dataComponent1);
        dataComponent2._id = undefined;
        dataComponent2.__t = undefined;
        dataComponent2.__v = undefined;
        const timestamp = new Date().toISOString();
        dataComponent2.stix.modified = timestamp;
        const body = dataComponent2;
        request(app)
            .post('/api/data-components')
            .send(body)
            .set('Accept', 'application/json')
            .expect(201)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the created data component
                    const dataComponent = res.body;
                    expect(dataComponent).toBeDefined();
                    done();
                }
            });
    });

    it('GET /api/data-components returns the latest added data component', function (done) {
        request(app)
            .get('/api/data-components/' + dataComponent2.stix.id)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one data component in an array
                    const dataComponents = res.body;
                    expect(dataComponents).toBeDefined();
                    expect(Array.isArray(dataComponents)).toBe(true);
                    expect(dataComponents.length).toBe(1);
                    const dataComponent = dataComponents[0];
                    expect(dataComponent.stix.id).toBe(dataComponent2.stix.id);
                    expect(dataComponent.stix.modified).toBe(dataComponent2.stix.modified);
                    done();
                }
            });
    });

    it('GET /api/data-components returns all added data component', function (done) {
        request(app)
            .get('/api/data-components/' + dataComponent1.stix.id + '?versions=all')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get two data components in an array
                    const dataComponents = res.body;
                    expect(dataComponents).toBeDefined();
                    expect(Array.isArray(dataComponents)).toBe(true);
                    expect(dataComponents.length).toBe(2);
                    done();
                }
            });
    });

    it('GET /api/data-components/:id/modified/:modified returns the first added data component', function (done) {
        request(app)
            .get('/api/data-components/' + dataComponent1.stix.id + '/modified/' + dataComponent1.stix.modified)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one data component in an array
                    const dataComponent = res.body;
                    expect(dataComponent).toBeDefined();
                    expect(dataComponent.stix).toBeDefined();
                    expect(dataComponent.stix.id).toBe(dataComponent1.stix.id);
                    expect(dataComponent.stix.modified).toBe(dataComponent1.stix.modified);
                    done();
                }
            });
    });

    it('GET /api/data-components/:id/modified/:modified returns the second added data component', function (done) {
        request(app)
            .get('/api/data-components/' + dataComponent2.stix.id + '/modified/' + dataComponent2.stix.modified)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one data component in an array
                    const dataComponent = res.body;
                    expect(dataComponent).toBeDefined();
                    expect(dataComponent.stix).toBeDefined();
                    expect(dataComponent.stix.id).toBe(dataComponent2.stix.id);
                    expect(dataComponent.stix.modified).toBe(dataComponent2.stix.modified);
                    done();
                }
            });
    });

    it('DELETE /api/data-components deletes a data component', function (done) {
        request(app)
            .delete('/api/data-components/' + dataComponent1.stix.id + '/modified/' + dataComponent1.stix.modified)
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

    it('DELETE /api/data-components should delete the second data component', function (done) {
        request(app)
            .delete('/api/data-components/' + dataComponent2.stix.id + '/modified/' + dataComponent2.stix.modified)
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

    it('GET /api/data-components returns an empty array of data components', function (done) {
        request(app)
            .get('/api/data-components')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get an empty array
                    const dataComponents = res.body;
                    expect(dataComponents).toBeDefined();
                    expect(Array.isArray(dataComponents)).toBe(true);
                    expect(dataComponents.length).toBe(0);
                    done();
                }
            });
    });

    after(async function() {
        await database.closeConnection();
    });
});

