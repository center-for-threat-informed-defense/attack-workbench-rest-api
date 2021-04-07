const request = require('supertest');
const expect = require('expect');
const fs = require('fs').promises;

const logger = require('../../lib/logger');
logger.level = 'debug';

const database = require('../../lib/database-in-memory')

async function readJson(path) {
    const filePath = require.resolve(path);
    const data = await fs.readFile(filePath);
    return JSON.parse(data);
}

describe('Collection Bundles API Full-Size Test', function () {
    let app;
    let collectionBundle72;
    let collectionBundle80;

    before(async function() {
        // Establish the database connection
        // Use an in-memory database that we spin up for the test
        await database.initializeConnection();

        // Initialize the express app
        app = await require('../../index').initializeApp();

        collectionBundle72 = await readJson('./enterprise-attack-7.2.json');
        collectionBundle80 = await readJson('./enterprise-attack-8.0.json');
    });

    it('POST /api/collection-bundles previews the import of a collection bundle', function (done) {
        const body = collectionBundle80;
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
                    expect(collection.workspace.import_categories.errors.length).toBe(0);
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
                    if (collection.workspace.import_categories.errors.length > 0) {
                        console.log(collection.workspace.import_categories.errors[0]);
                    }
                    expect(collection.workspace.import_categories.errors.length).toBe(0);
                    console.log(`references, additions: ${ collection.workspace.import_references.additions.length }`);
                    console.log(`references, changes: ${ collection.workspace.import_references.changes.length }`);
                    done();
                }
            });
    });

    it('POST /api/collection-bundles imports the 8.0 enterprise collection bundle', function (done) {
        this.timeout(60000);
        const body = collectionBundle80;
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
                    expect(collection.workspace.import_categories.errors.length).toBe(0);
                    console.log(`references, additions: ${ collection.workspace.import_references.additions.length }`);
                    console.log(`references, changes: ${ collection.workspace.import_references.changes.length }`);
                    done();
                }
            });
    });

    after(async function() {
        await database.closeConnection();
    });
});