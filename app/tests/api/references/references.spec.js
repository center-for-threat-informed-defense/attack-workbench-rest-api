const request = require('supertest');
const expect = require('expect');

const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');
const login = require('../../shared/login');

const logger = require('../../../lib/logger');
logger.level = 'debug';

const Reference = require('../../../models/reference-model');

// modified and created properties will be set before calling REST API
// stix.id property will be created by REST API
const initialObjectData1 = {
    source_name: 'source 1',
    description: 'This is a reference (#1)',
    url: 'https://www.reference-site.com/myreferencelink1'
};

const initialObjectData2 = {
    source_name: 'source 2',
    description: 'This is a reference (#2)',
    url: 'https://www.reference-site.com/myreferencelink2'
};

const initialObjectData3 = {
    source_name: 'source 3',
    description: 'This is a reference (#3)',
    url: 'https://www.reference-site.com/myreferencelink3'
};

describe('References API', function () {
    let app;
    let passportCookie;

    before(async function() {
        // Establish the database connection
        // Use an in-memory database that we spin up for the test
        await database.initializeConnection();

        // Check for a valid database configuration
        await databaseConfiguration.checkSystemConfiguration();

        // Wait until the Reference indexes are created
        await Reference.init();

        // Initialize the express app
        app = await require('../../../index').initializeApp();

        // Log into the app
        passportCookie = await login.loginAnonymous(app);
    });

    it('GET /api/references returns an empty array of references', function (done) {
            request(app)
                .get('/api/references')
                .set('Accept', 'application/json')
                .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
                .expect(200)
                .expect('Content-Type', /json/)
                .end(function (err, res) {
                    if (err) {
                        done(err);
                    } else {
                        // We expect to get an empty array
                        const references = res.body;
                        expect(references).toBeDefined();
                        expect(Array.isArray(references)).toBe(true);
                        expect(references.length).toBe(0);
                        done();
                    }
                })
    });

    it('POST /api/references does not create an empty reference', function (done) {
        const body = { };
        request(app)
            .post('/api/references')
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

    let reference1;
    it('POST /api/references creates a reference', function (done) {
        const body = initialObjectData1;
        request(app)
            .post('/api/references')
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
                    // We expect to get the created reference
                    reference1 = res.body;
                    expect(reference1).toBeDefined();
                    done();
                }
            });
    });

    let reference2;
    it('POST /api/references creates a second reference', function (done) {
        const body = initialObjectData2;
        request(app)
            .post('/api/references')
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
                    // We expect to get the created reference
                    reference2 = res.body;
                    expect(reference2).toBeDefined();
                    done();
                }
            });
    });

    let reference3;
    it('POST /api/references creates a third reference', function (done) {
        const body = initialObjectData3;
        request(app)
            .post('/api/references')
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
                    // We expect to get the created reference
                    reference3 = res.body;
                    expect(reference3).toBeDefined();
                    done();
                }
            });
    });

    it('GET /api/references returns the added references', function (done) {
        request(app)
            .get('/api/references')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one reference in an array
                    const references = res.body;
                    expect(references).toBeDefined();
                    expect(Array.isArray(references)).toBe(true);
                    expect(references.length).toBe(3);
                    done();
                }
            });
    });

    it('GET /api/references should return an empty array of references when the source_name cannot be found', function (done) {
        request(app)
            .get('/api/references?sourceName=notasourcename')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get an empty array
                    const references = res.body;
                    expect(references).toBeDefined();
                    expect(Array.isArray(references)).toBe(true);
                    expect(references.length).toBe(0);
                    done();
                }
            });
    });

    it('GET /api/references returns the first added reference', function (done) {
        request(app)
            .get('/api/references?sourceName=' + encodeURIComponent(reference1.source_name))
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one reference in an array
                    const references = res.body;
                    expect(references).toBeDefined();
                    expect(Array.isArray(references)).toBe(true);
                    expect(references.length).toBe(1);

                    const reference = references[0];
                    expect(reference).toBeDefined();
                    expect(reference.source_name).toBe(reference1.source_name);
                    expect(reference.description).toBe(reference1.description);
                    expect(reference.url).toBe(reference1.url);

                    done();
                }
            });
    });

    it('GET /api/references uses the search parameter to return the third added reference', function (done) {
        request(app)
            .get('/api/references?search=' + encodeURIComponent('#3'))
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one reference in an array
                    const references = res.body;
                    expect(references).toBeDefined();
                    expect(Array.isArray(references)).toBe(true);
                    expect(references.length).toBe(1);

                    const reference = references[0];
                    expect(reference).toBeDefined();
                    expect(reference.source_name).toBe(reference3.source_name);
                    expect(reference.description).toBe(reference3.description);
                    expect(reference.url).toBe(reference3.url);

                    done();
                }
            });
    });

    it('PUT /api/references does not update a reference when the source_name is missing', function (done) {
        const body = { description: 'This reference does not have a source_name', url: '' };
        request(app)
            .put('/api/references')
            .send(body)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(400)
            .end(function(err) {
                if (err) {
                    done(err);
                }
                else {
                    done();
                }
            });
    });

    it('PUT /api/references does not update a reference when the source_name is not in the database', function (done) {
        const body = {  source_name: 'not-a-reference', description: 'This reference is not in the database', url: '' };
        request(app)
            .put('/api/references')
            .send(body)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(404)
            .end(function(err) {
                if (err) {
                    done(err);
                }
                else {
                    done();
                }
            });
    });

    it('PUT /api/references updates a reference', function (done) {
        reference1.description = 'This is a new description';
        const body = reference1;
        request(app)
            .put('/api/references')
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
                    // We expect to get the updated reference
                    const reference = res.body;
                    expect(reference).toBeDefined();
                    expect(reference.source_name).toBe(reference1.source_name);
                    expect(reference.description).toBe(reference1.description);
                    done();
                }
            });
    });

    it('POST /api/references does not create a reference with a duplicate source_name', function (done) {
        const body = reference1;
        request(app)
            .post('/api/references')
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

    it('DELETE /api/references does not delete a reference when the source_name is omitted', function (done) {
        request(app)
            .delete('/api/references')
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

    it('DELETE /api/references does not delete a reference with a non-existent source_name', function (done) {
        request(app)
            .delete('/api/references?sourceName=not-a-reference')
            .set('Accept', 'application/json')
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

    it('DELETE /api/references deletes a reference', function (done) {
        request(app)
            .delete(`/api/references?sourceName=${ reference1.source_name }`)
            .set('Accept', 'application/json')
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

