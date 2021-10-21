const request = require('supertest');
const expect = require('expect');
const fs = require('fs').promises;

const logger = require('../../lib/logger');
logger.level = 'debug';

const database = require('../../lib/database-in-memory');
const databaseConfiguration = require('../../lib/database-configuration');

async function readJson(path) {
    const filePath = require.resolve(path);
    const data = await fs.readFile(filePath);
    return JSON.parse(data);
}

describe('Collection Bundles API Full-Size Test', function () {
    let app;
    let collectionBundle72;
    let collectionBundle82;
    let collectionBundle90;

    before(async function() {
        // Establish the database connection
        // Use an in-memory database that we spin up for the test
        await database.initializeConnection();

        // Check for a valid database configuration
        await databaseConfiguration.checkSystemConfiguration();

        // Initialize the express app
        app = await require('../../index').initializeApp();

        collectionBundle72 = await readJson('./enterprise-attack-7.2.json');
        collectionBundle82 = await readJson('./enterprise-attack-8.2.json');
        collectionBundle90 = await readJson('./enterprise-attack-9.0.json');
    });

    it('POST /api/collection-bundles previews the import of a 9.0 collection bundle (checkOnly)', function (done) {
        const body = collectionBundle90;
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
                    const collection = res.body;
                    expect(collection).toBeDefined();

                    // MITRE marking definition is missing from x_mitre_contents in the 9.0 bundle
                    expect(collection.workspace.import_categories.errors.length).toBe(1);

                    done();
                }
            });
    });

    it('POST /api/collection-bundles previews the import of a 8.2 collection bundle (checkOnly)', function (done) {
        const body = collectionBundle82;
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
                    const collection = res.body;
                    expect(collection).toBeDefined();

                    // MITRE marking definition is missing from x_mitre_contents in the 8.2 bundle
                    expect(collection.workspace.import_categories.errors.length).toBe(1);

                    done();
                }
            });
    });

    it('POST /api/collection-bundles previews the import of a 8.2 collection bundle (previewOnly)', function (done) {
        const body = collectionBundle82;
        request(app)
            .post('/api/collection-bundles?previewOnly=true')
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
                    expect(collection).toBeDefined();

                    // MITRE marking definition is missing from x_mitre_contents in the 8.2 bundle
                    expect(collection.workspace.import_categories.errors.length).toBe(1);

                    done();
                }
            });
    });

    it('POST /api/collection-bundles imports the 7.2 enterprise collection bundle', function (done) {
        this.timeout(60000);
        const body = collectionBundle72;
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
                    expect(collection).toBeDefined();

                    // MITRE marking definition is missing from x_mitre_contents in the 7.2 bundle
                    expect(collection.workspace.import_categories.errors.length).toBe(1);

                    done();
                }
            });
    });

    it('POST /api/collection-bundles imports the 9.0 enterprise collection bundle', function (done) {
        this.timeout(60000);
        const body = collectionBundle90;
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
                    expect(collection).toBeDefined();

                    // MITRE marking definition is missing from x_mitre_contents in the 9.0 bundle
                    expect(collection.workspace.import_categories.errors.length).toBe(1);

                    done();
                }
            });
    });

    it('POST /api/collection-bundles imports the 8.2 enterprise collection bundle', function (done) {
        this.timeout(60000);
        const body = collectionBundle82;
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
                    expect(collection).toBeDefined();

                    // MITRE marking definition is missing from x_mitre_contents in the 8.2 bundle
                    expect(collection.workspace.import_categories.errors.length).toBe(1);

                    done();
                }
            });
    });

    const domain = 'enterprise-attack';
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
                    // We expect to get the exported stix bundle
                    const stixBundle = res.body;
                    expect(stixBundle).toBeDefined();
                    expect(Array.isArray(stixBundle.objects)).toBe(true);

                    // We expect to get at most one of any object
                    const objectMap = new Map();
                    for (const stixObject of stixBundle.objects) {
                        expect(objectMap.get(stixObject.id)).toBeUndefined();
                        objectMap.set(stixObject.id, stixObject.id);
                    }

                    done();
                }
            });
    });

    after(async function() {
        await database.closeConnection();
    });
});
