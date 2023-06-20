const request = require('supertest');
const { expect } = require('expect');
const _ = require('lodash');

const config = require('../../../config/config');
const login = require('../../shared/login');

const logger = require('../../../lib/logger');
logger.level = 'debug';

const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');

// modified and created properties will be set before calling REST API
const initialCollectionData = {
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

const mitigationData1 = {
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

const mitigationData2 = {
    workspace: {
        workflow: {
            state: 'work-in-progress'
        }
    },
    stix: {
        name: 'course-of-action-2',
        spec_version: '2.1',
        type: 'course-of-action',
        description: 'This is another mitigation.',
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

describe('Collections (x-mitre-collection) Basic API', function () {
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

    it('POST /api/mitigations creates a mitigation', function (done) {
        const timestamp = new Date().toISOString();
        mitigationData1.stix.created = timestamp;
        mitigationData1.stix.modified = timestamp;
        const body = mitigationData1;
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
                    expect(mitigation.stix).toBeDefined();
                    expect(mitigation.stix.id).toBeDefined();

                    // Add this object to the collection data
                    const contentsObject = {
                        object_ref: mitigation.stix.id,
                        object_modified: mitigation.stix.modified
                    }
                    initialCollectionData.stix.x_mitre_contents.push(contentsObject);

                    done();
                }
            });
    });

    let mitigation2;
    it('POST /api/mitigations creates another mitigation', function (done) {
        const timestamp = new Date().toISOString();
        mitigationData2.stix.created = timestamp;
        mitigationData2.stix.modified = timestamp;
        const body = mitigationData2;
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
                    mitigation2 = res.body;

                    done();
                }
            });
    });
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
                    const software = res.body;
                    expect(software).toBeDefined();
                    expect(software.stix).toBeDefined();
                    expect(software.stix.id).toBeDefined();

                    // Add this object to the collection data
                    const contentsObject = {
                        object_ref: software.stix.id,
                        object_modified: software.stix.modified
                    }
                    initialCollectionData.stix.x_mitre_contents.push(contentsObject);

                    done();
                }
            });
    });

    it('GET /api/collections returns an empty array of collections', function (done) {
        request(app)
            .get('/api/collections')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    // We expect to get an empty array
                    const collections = res.body;
                    expect(collections).toBeDefined();
                    expect(Array.isArray(collections)).toBe(true);
                    expect(collections.length).toBe(0);
                    done();
                }
            });
    });

    it('POST /api/collections does not create an empty collection', function (done) {
        const body = {};
        request(app)
            .post('/api/collections')
            .send(body)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(400)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    done();
                }
            });
    });

    let collection1;
    it('POST /api/collections creates a collection', function (done) {
        const timestamp = new Date().toISOString();
        initialCollectionData.stix.created = timestamp;
        initialCollectionData.stix.modified = timestamp;
        const body = initialCollectionData;
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
                    collection1 = res.body;
                    expect(collection1).toBeDefined();
                    expect(collection1.stix).toBeDefined();
                    expect(collection1.stix.id).toBeDefined();
                    expect(collection1.stix.created).toBeDefined();
                    expect(collection1.stix.modified).toBeDefined();
                    expect(collection1.stix.x_mitre_attack_spec_version).toBe(config.app.attackSpecVersion);

                    done();
                }
            });
    });

    it('GET /api/collections returns the added collection', function (done) {
        request(app)
            .get('/api/collections')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    // We expect to get one collection in an array
                    const collections = res.body;
                    expect(collections).toBeDefined();
                    expect(Array.isArray(collections)).toBe(true);
                    expect(collections.length).toBe(1);
                    done();
                }
            });
    });

    it('GET /api/collections/:id should not return a collection when the id cannot be found', function (done) {
        request(app)
            .get('/api/collections/not-an-id')
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

    it('GET /api/collections/:id returns the added collection', function (done) {
        request(app)
            .get('/api/collections/' + collection1.stix.id)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    // We expect to get one collection in an array
                    const collections = res.body;
                    expect(collections).toBeDefined();
                    expect(Array.isArray(collections)).toBe(true);
                    expect(collections.length).toBe(1);

                    const collection = collections[0];
                    expect(collection).toBeDefined();
                    expect(collection.stix).toBeDefined();
                    expect(collection.stix.id).toBe(collection1.stix.id);
                    expect(collection.stix.type).toBe(collection1.stix.type);
                    expect(collection.stix.name).toBe(collection1.stix.name);
                    expect(collection.stix.description).toBe(collection1.stix.description);
                    expect(collection.stix.spec_version).toBe(collection1.stix.spec_version);
                    expect(collection.stix.object_marking_refs).toEqual(expect.arrayContaining(collection1.stix.object_marking_refs));
                    expect(collection.stix.created_by_ref).toBe(collection1.stix.created_by_ref);
                    expect(collection.stix.x_mitre_attack_spec_version).toBe(collection1.stix.x_mitre_attack_spec_version);

                    expect(collection.contents).toBeUndefined();

                    done();
                }
            });
    });

    it('GET /api/collections/:id with retrieveContents flag returns the added collection with contents', function (done) {
        request(app)
            .get('/api/collections/' + collection1.stix.id + '?retrieveContents=true')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    // We expect to get one collection in an array
                    const collections = res.body;
                    expect(collections).toBeDefined();
                    expect(Array.isArray(collections)).toBe(true);
                    expect(collections.length).toBe(1);

                    const collection = collections[0];
                    expect(collection).toBeDefined();
                    expect(collection.stix).toBeDefined();
                    expect(collection.stix.id).toBe(collection1.stix.id);
                    expect(collection.stix.type).toBe(collection1.stix.type);
                    expect(collection.stix.name).toBe(collection1.stix.name);
                    expect(collection.stix.description).toBe(collection1.stix.description);
                    expect(collection.stix.spec_version).toBe(collection1.stix.spec_version);
                    expect(collection.stix.object_marking_refs).toEqual(expect.arrayContaining(collection1.stix.object_marking_refs));
                    expect(collection.stix.created_by_ref).toBe(collection1.stix.created_by_ref);

                    expect(collection.contents).toBeDefined();
                    expect(Array.isArray(collection.contents)).toBe(true);
                    expect(collection.contents.length).toBe(2);

                    done();
                }
            });
    });

    it('POST /api/collections does not create a collection with the same id and modified date', function (done) {
        const body = collection1;
        request(app)
            .post('/api/collections')
            .send(body)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(409)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    done();
                }
            });
    });

    let collection2;
    it('POST /api/collections should create a new version of a collection with a duplicate stix.id but different stix.modified date', function (done) {
        const collection = _.cloneDeep(collection1);
        collection._id = undefined;
        collection.__t = undefined;
        collection.__v = undefined;
        const timestamp = new Date().toISOString();
        collection.stix.modified = timestamp;

        // Add the second mitigation object to the collection data
        const contentsObject = {
            object_ref: mitigation2.stix.id,
            object_modified: mitigation2.stix.modified
        }
        collection.stix.x_mitre_contents.push(contentsObject);

        const body = collection;
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
                    collection2 = res.body;
                    expect(collection2).toBeDefined();
                    done();
                }
            });
    });

    it('GET /api/collections/:id returns the latest added collection', function (done) {
        request(app)
            .get('/api/collections/' + collection2.stix.id)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    // We expect to get one collection in an array
                    const collections = res.body;
                    expect(collections).toBeDefined();
                    expect(Array.isArray(collections)).toBe(true);
                    expect(collections.length).toBe(1);
                    const collection = collections[0];
                    expect(collection.stix.id).toBe(collection2.stix.id);
                    expect(collection.stix.modified).toBe(collection2.stix.modified);
                    done();
                }
            });
    });

    it('GET /api/collections/:id/modified/:modified returns the proper collection', function (done) {
        request(app)
            .get('/api/collections/' + collection1.stix.id + '/modified/' + collection1.stix.modified)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    // We expect to get one collection
                    const collection = res.body;
                    expect(collection).toBeDefined();
                    expect(collection.stix).toBeDefined();
                    expect(collection.stix.id).toBe(collection1.stix.id);
                    expect(collection.stix.modified).toBe(collection1.stix.modified);
                    done();
                }
            });
    });

    it('GET /api/collections/:id/modified/:modified with retrieveContents flag returns the first version of the collection with its contents', function (done) {
        request(app)
            .get('/api/collections/' + collection1.stix.id + '/modified/' + collection1.stix.modified + '?retrieveContents=true')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    // We expect to get one collection
                    const collection = res.body;
                    expect(collection).toBeDefined();
                    expect(collection.stix).toBeDefined();
                    expect(collection.stix.id).toBe(collection1.stix.id);
                    expect(collection.stix.modified).toBe(collection1.stix.modified);

                    expect(collection.contents).toBeDefined();
                    expect(Array.isArray(collection.contents)).toBe(true);
                    expect(collection.contents.length).toBe(2);
                    done();
                }
            });
    });

    it('GET /api/collections/:id/modified/:modified with retrieveContents flag returns the second version of the collection with its contents', function (done) {
        request(app)
            .get('/api/collections/' + collection2.stix.id + '/modified/' + collection2.stix.modified + '?retrieveContents=true')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    // We expect to get one collection
                    const collection = res.body;
                    expect(collection).toBeDefined();
                    expect(collection.stix).toBeDefined();
                    expect(collection.stix.id).toBe(collection2.stix.id);
                    expect(collection.stix.modified).toBe(collection2.stix.modified);

                    expect(collection.contents).toBeDefined();
                    expect(Array.isArray(collection.contents)).toBe(true);
                    expect(collection.contents.length).toBe(3);
                    done();
                }
            });
    });

    it('GET /api/collections returns all added collections', function (done) {
        request(app)
            .get('/api/collections/' + collection1.stix.id + '?versions=all')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    // We expect to get two collections in an array
                    const collections = res.body;
                    expect(collections).toBeDefined();
                    expect(Array.isArray(collections)).toBe(true);
                    expect(collections.length).toBe(2);
                    done();
                }
            });
    });

    it('DELETE /api/collections/:id should not delete a collection when the id cannot be found', function (done) {
        request(app)
            .delete('/api/collections/not-an-id')
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

    it('DELETE /api/collections/:id/modified/:modified deletes a collection and its contents', function (done) {
        request(app)
            .delete('/api/collections/' + collection2.stix.id + '/modified/' + collection2.stix.modified + '?deleteAllContents=true')
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

    it('GET /api/mitigations/:id should not return a mitigation that was deleted when the collection was deleted', function (done) {
        request(app)
            .get(`/api/mitigations/${ mitigation2.stix.id }`)
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

    // This should return all the objects, showing that the previous delete didn't remove objects that were in both
    // versions of the collection
    it('GET /api/collections/:id with retrieveContents flag returns the added collection with contents', function (done) {
        request(app)
            .get('/api/collections/' + collection1.stix.id + '?retrieveContents=true')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    // We expect to get one collection in an array
                    const collections = res.body;
                    expect(collections).toBeDefined();
                    expect(Array.isArray(collections)).toBe(true);
                    expect(collections.length).toBe(1);

                    const collection = collections[0];
                    expect(collection).toBeDefined();
                    expect(collection.stix).toBeDefined();
                    expect(collection.stix.id).toBe(collection1.stix.id);

                    expect(collection.contents).toBeDefined();
                    expect(Array.isArray(collection.contents)).toBe(true);
                    expect(collection.contents.length).toBe(2);
                    console.log(collection.contents[0]);
                    console.log(collection.contents[1]);

                    done();
                }
            });
    });

    it('DELETE /api/collections/:id should delete all of the collections with the stix id', function (done) {
        request(app)
            .delete('/api/collections/' + collection1.stix.id)
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

    after(async function() {
        await database.closeConnection();
    });
});
