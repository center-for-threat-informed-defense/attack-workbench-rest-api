const request = require('supertest');
const { expect } = require('expect');
const _ = require('lodash');

const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');

const config = require('../../../config/config');
const login = require('../../shared/login');

const dataComponentsService = require('../../../services/data-components-service');

const logger = require('../../../lib/logger');
logger.level = 'debug';

// modified and created properties will be set before calling REST API
// stix.id property will be created by REST API
const initialDataSourceData = {
    workspace: {
        workflow: {
            state: 'work-in-progress'
        }
    },
    stix: {
        name: 'data-source-1',
        spec_version: '2.1',
        type: 'x-mitre-data-source',
        description: 'This is a data source.',
        external_references: [
            { source_name: 'source-1', external_id: 's1' }
        ],
        object_marking_refs: [ 'marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168' ],
        created_by_ref: "identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5",
        x_mitre_version: "1.1",
        x_mitre_platforms: [
            'macOS',
            'Office 365',
            'Google Workspace',
            'Linux',
            'Network'
        ],
        x_mitre_collection_layers: [
            'duis',
            'laboris'
        ],
        x_mitre_contributors: [
            'Herbert Examplecontributor'
        ],
        x_mitre_domains: [
            'enterprise-attack'
        ],
        x_mitre_modified_by_ref: 'identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5'
    }
};

const initialDataComponentData = {
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
async function loadDataComponents(baseDataComponent) {
    const data1 = _.cloneDeep(baseDataComponent);
    let timestamp = new Date().toISOString();
    data1.stix.created = timestamp;
    data1.stix.modified = timestamp;
    await dataComponentsService.create(data1);

    const data2 = _.cloneDeep(baseDataComponent);
    timestamp = new Date().toISOString();
    data2.stix.created = timestamp;
    data2.stix.modified = timestamp;
    await dataComponentsService.create(data2);

    const data3 = _.cloneDeep(baseDataComponent);
    timestamp = new Date().toISOString();
    data3.stix.created = timestamp;
    data3.stix.modified = timestamp;
    await dataComponentsService.create(data3);

    const data4 = _.cloneDeep(baseDataComponent);
    timestamp = new Date().toISOString();
    data4.stix.created = timestamp;
    data4.stix.modified = timestamp;
    data4.stix.x_mitre_deprecated = true;
    await dataComponentsService.create(data4);

    const data5 = _.cloneDeep(baseDataComponent);
    timestamp = new Date().toISOString();
    data5.stix.created = timestamp;
    data5.stix.modified = timestamp;
    data5.stix.revoked = true;
    await dataComponentsService.create(data5);
}

describe('Data Sources API', function () {
    let app;
    let passportCookie;

    before(async function() {
        // this.timeout(0);
        // this.timeout(100000);



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

    it('GET /api/data-sources returns an empty array of data sources', function (done) {
        request(app)
            .get('/api/data-sources')
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
                    const dataSources = res.body;
                    expect(dataSources).toBeDefined();
                    expect(Array.isArray(dataSources)).toBe(true);
                    expect(dataSources.length).toBe(0);
                    done();
                }
            });
    });

    it('POST /api/data-sources does not create an empty data source', function (done) {
        const body = { };
        request(app)
            .post('/api/data-sources')
            .send(body)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
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

    let dataSource1;
    it('POST /api/data-sources creates a data source', function (done) {
        const timestamp = new Date().toISOString();
        initialDataSourceData.stix.created = timestamp;
        initialDataSourceData.stix.modified = timestamp;
        const body = initialDataSourceData;
        request(app)
            .post('/api/data-sources')
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
                    // We expect to get the created data source
                    dataSource1 = res.body;
                    expect(dataSource1).toBeDefined();
                    expect(dataSource1.stix).toBeDefined();
                    expect(dataSource1.stix.id).toBeDefined();
                    expect(dataSource1.stix.created).toBeDefined();
                    expect(dataSource1.stix.modified).toBeDefined();
                    expect(dataSource1.stix.x_mitre_attack_spec_version).toBe(config.app.attackSpecVersion);

                    done();
                }
            });
    });

    it('GET /api/data-sources returns the added data source', function (done) {
        request(app)
            .get('/api/data-sources')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one data source in an array
                    const dataSource = res.body;
                    expect(dataSource).toBeDefined();
                    expect(Array.isArray(dataSource)).toBe(true);
                    expect(dataSource.length).toBe(1);
                    done();
                }
            });
    });

    it('GET /api/data-sources/:id should not return a data source when the id cannot be found', function (done) {
        request(app)
            .get('/api/data-sources/not-an-id')
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

    it('GET /api/data-sources/:id returns the added data source', function (done) {
        request(app)
            .get('/api/data-sources/' + dataSource1.stix.id)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one data source in an array
                    const dataSources = res.body;
                    expect(dataSources).toBeDefined();
                    expect(Array.isArray(dataSources)).toBe(true);
                    expect(dataSources.length).toBe(1);

                    const dataSource = dataSources[0];
                    expect(dataSource).toBeDefined();
                    expect(dataSource.stix).toBeDefined();
                    expect(dataSource.stix.id).toBe(dataSource1.stix.id);
                    expect(dataSource.stix.type).toBe(dataSource1.stix.type);
                    expect(dataSource.stix.name).toBe(dataSource1.stix.name);
                    expect(dataSource.stix.description).toBe(dataSource1.stix.description);
                    expect(dataSource.stix.spec_version).toBe(dataSource1.stix.spec_version);
                    expect(dataSource.stix.object_marking_refs).toEqual(expect.arrayContaining(dataSource1.stix.object_marking_refs));
                    expect(dataSource.stix.created_by_ref).toBe(dataSource1.stix.created_by_ref);
                    expect(dataSource.stix.x_mitre_version).toBe(dataSource1.stix.x_mitre_version);
                    expect(dataSource.stix.x_mitre_attack_spec_version).toBe(dataSource1.stix.x_mitre_attack_spec_version);

                    done();
                }
            });
    });

    it('GET /api/data-sources/:id returns the added data source with data components', function (done) {
        initialDataComponentData.stix.x_mitre_data_source_ref = dataSource1.stix.id;
        loadDataComponents(initialDataComponentData);

        //this.timeout(0);

        request(app)
            .get(`/api/data-sources/${dataSource1.stix.id}?retrieveDataComponents=true`)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {

                    // We expect to get one data source in an array
                    const dataSources = res.body;
                    expect(dataSources).toBeDefined();
                    expect(Array.isArray(dataSources)).toBe(true);
                    expect(dataSources.length).toBe(1);
                    const dataSource = dataSources[0];
                    expect(dataSource).toBeDefined();

                    // We expect to get 5 data components that reference this data source
                    expect(dataSource.dataComponents).toBeDefined();
                    expect(dataSource.dataComponents.length).toBe(5);
                    done();
                }
            }); //.catch(done);
    });

    it('PUT /api/data-sources updates a data source', function (done) {
        const originalModified = dataSource1.stix.modified;
        const timestamp = new Date().toISOString();
        dataSource1.stix.modified = timestamp;
        dataSource1.stix.description = 'This is an updated data source.'
        const body = dataSource1;
        request(app)
            .put('/api/data-sources/' + dataSource1.stix.id + '/modified/' + originalModified)
            .send(body)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the updated data source
                    const dataSource = res.body;
                    expect(dataSource).toBeDefined();
                    expect(dataSource.stix.id).toBe(dataSource1.stix.id);
                    expect(dataSource.stix.modified).toBe(dataSource1.stix.modified);
                    done();
                }
            });
    });

    it('POST /api/data-sources does not create a data source with the same id and modified date', function (done) {
        const body = dataSource1;
        request(app)
            .post('/api/data-sources')
            .send(body)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
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

    let dataSource2;
    it('POST /api/data-sources should create a new version of a data source with a duplicate stix.id but different stix.modified date', function (done) {
        dataSource2 = _.cloneDeep(dataSource1);
        dataSource2._id = undefined;
        dataSource2.__t = undefined;
        dataSource2.__v = undefined;
        const timestamp = new Date().toISOString();
        dataSource2.stix.modified = timestamp;
        const body = dataSource2;
        request(app)
            .post('/api/data-sources')
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
                    // We expect to get the created data source
                    const dataSource = res.body;
                    expect(dataSource).toBeDefined();
                    done();
                }
            });
    });

    it('GET /api/data-sources returns the latest added data source', function (done) {
        request(app)
            .get('/api/data-sources/' + dataSource2.stix.id)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one data source in an array
                    const dataSources = res.body;
                    expect(dataSources).toBeDefined();
                    expect(Array.isArray(dataSources)).toBe(true);
                    expect(dataSources.length).toBe(1);
                    const dataSource = dataSources[0];
                    expect(dataSource.stix.id).toBe(dataSource2.stix.id);
                    expect(dataSource.stix.modified).toBe(dataSource2.stix.modified);
                    done();
                }
            });
    });

    it('GET /api/data-sources returns all added data source', function (done) {
        request(app)
            .get('/api/data-sources/' + dataSource1.stix.id + '?versions=all')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get two data sources in an array
                    const dataSources = res.body;
                    expect(dataSources).toBeDefined();
                    expect(Array.isArray(dataSources)).toBe(true);
                    expect(dataSources.length).toBe(2);
                    done();
                }
            });
    });

    it('GET /api/data-sources/:id/modified/:modified returns the first added data source', function (done) {
        request(app)
            .get('/api/data-sources/' + dataSource1.stix.id + '/modified/' + dataSource1.stix.modified)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one data source in an array
                    const dataSource = res.body;
                    expect(dataSource).toBeDefined();
                    expect(dataSource.stix).toBeDefined();
                    expect(dataSource.stix.id).toBe(dataSource1.stix.id);
                    expect(dataSource.stix.modified).toBe(dataSource1.stix.modified);
                    done();
                }
            });
    });

    it('GET /api/data-sources/:id/modified/:modified returns the second added data source', function (done) {
        request(app)
            .get('/api/data-sources/' + dataSource2.stix.id + '/modified/' + dataSource2.stix.modified)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one data source in an array
                    const dataSource = res.body;
                    expect(dataSource).toBeDefined();
                    expect(dataSource.stix).toBeDefined();
                    expect(dataSource.stix.id).toBe(dataSource2.stix.id);
                    expect(dataSource.stix.modified).toBe(dataSource2.stix.modified);
                    done();
                }
            });
    });

    let dataSource3;
    it('POST /api/data-sources should create a new version of a data source with a duplicate stix.id but different stix.modified date', function (done) {
        dataSource3 = _.cloneDeep(dataSource1);
        dataSource3._id = undefined;
        dataSource3.__t = undefined;
        dataSource3.__v = undefined;
        const timestamp = new Date().toISOString();
        dataSource3.stix.modified = timestamp;
        const body = dataSource3;
        request(app)
            .post('/api/data-sources')
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
                    // We expect to get the created data source
                    const dataSource = res.body;
                    expect(dataSource).toBeDefined();
                    done();
                }
            });
    });

    it('DELETE /api/data-sources/:id should not delete a data source when the id cannot be found', function (done) {
        request(app)
            .delete('/api/data-sources/not-an-id')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(404)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    done();
                }
            });
    });

    it('DELETE /api/data-sources/:id/modified/:modified deletes a data source', function (done) {
        request(app)
            .delete('/api/data-sources/' + dataSource1.stix.id + '/modified/' + dataSource1.stix.modified)
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
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

    it('DELETE /api/data-sources/:id should delete all the data sources with the same stix id', function (done) {
        request(app)
            .delete('/api/data-sources/' + dataSource2.stix.id)
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
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

    it('GET /api/data-sources returns an empty array of data sources', function (done) {
        request(app)
            .get('/api/data-sources')
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
                    const dataSources = res.body;
                    expect(dataSources).toBeDefined();
                    expect(Array.isArray(dataSources)).toBe(true);
                    expect(dataSources.length).toBe(0);
                    done();
                }
            });
    });

    after(async function() {
        await database.closeConnection();
    });
});

