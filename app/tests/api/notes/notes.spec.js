const request = require('supertest');
const expect = require('expect');
const _ = require('lodash');

const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');

const config = require('../../../config/config');
const login = require('../../shared/login');

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
        spec_version: '2.1',
        type: 'note',
        abstract: 'This is the abstract for a note. Ivory.',
        content: 'This is the content for a note.',
        authors: [
            'Author 1',
            'Author 2'
        ],
        external_references: [
            { source_name: 'source-1', external_id: 's1' }
        ],
        object_marking_refs: [ 'marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168' ],
        created_by_ref: "identity--6444f546-6900-4456-b3b1-015c88d70dab",
        object_refs: [ 'marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168' ],
    }
};

describe('Notes API', function () {
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

    it('GET /api/notes should return an empty array of notes', function (done) {
        request(app)
            .get('/api/notes')
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
                    const notes = res.body;
                    expect(notes).toBeDefined();
                    expect(Array.isArray(notes)).toBe(true);
                    expect(notes.length).toBe(0);
                    done();
                }
            });
    });

    it('POST /api/notes should not create an empty note', function (done) {
        const body = { };
        request(app)
            .post('/api/notes')
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

    let note1;
    it('POST /api/notes should create a note', function (done) {
        const timestamp = new Date().toISOString();
        initialObjectData.stix.created = timestamp;
        initialObjectData.stix.modified = timestamp;
        const body = initialObjectData;
        request(app)
            .post('/api/notes')
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
                    // We expect to get the created note
                    note1 = res.body;
                    expect(note1).toBeDefined();
                    expect(note1.stix).toBeDefined();
                    expect(note1.stix.id).toBeDefined();
                    expect(note1.stix.created).toBeDefined();
                    expect(note1.stix.modified).toBeDefined();
                    expect(note1.stix.x_mitre_attack_spec_version).toBe(config.app.attackSpecVersion);

                    done();
                }
            });
    });

    it('GET /api/notes should return the added note', function (done) {
        request(app)
            .get('/api/notes')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one note in an array
                    const notes = res.body;
                    expect(notes).toBeDefined();
                    expect(Array.isArray(notes)).toBe(true);
                    expect(notes.length).toBe(1);
                    done();
                }
            });
    });

    it('GET /api/notes/:id should not return a note when the id cannot be found', function (done) {
        request(app)
            .get('/api/notes/not-an-id')
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

    it('GET /api/notes/:id should return the added note', function (done) {
        request(app)
            .get('/api/notes/' + note1.stix.id)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one note in an array
                    const notes = res.body;
                    expect(notes).toBeDefined();
                    expect(Array.isArray(notes)).toBe(true);
                    expect(notes.length).toBe(1);

                    const note = notes[0];
                    expect(note).toBeDefined();
                    expect(note.stix).toBeDefined();
                    expect(note.stix.id).toBe(note1.stix.id);
                    expect(note.stix.type).toBe(note1.stix.type);
                    expect(note.stix.abstract).toBe(note1.stix.abstract);
                    expect(note.stix.content).toBe(note1.stix.content);
                    expect(note.stix.spec_version).toBe(note1.stix.spec_version);
                    expect(note.stix.object_refs).toEqual(expect.arrayContaining(note1.stix.object_refs));
                    expect(note.stix.created_by_ref).toBe(note1.stix.created_by_ref);
                    expect(note.stix.x_mitre_attack_spec_version).toBe(note1.stix.x_mitre_attack_spec_version);

                    done();
                }
            });
    });

    it('PUT /api/notes should update a note', function (done) {
        const originalModified = note1.stix.modified;
        const timestamp = new Date().toISOString();
        note1.stix.modified = timestamp;
        note1.stix.description = 'This is an updated note.'
        const body = note1;
        request(app)
            .put('/api/notes/' + note1.stix.id + '/modified/' + originalModified)
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
                    // We expect to get the updated note
                    const note = res.body;
                    expect(note).toBeDefined();
                    expect(note.stix.id).toBe(note1.stix.id);
                    expect(note.stix.modified).toBe(note1.stix.modified);
                    done();
                }
            });
    });

    it('POST /api/notes should not create a note with the same id and modified date', function (done) {
        const body = note1;
        request(app)
            .post('/api/notes')
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

    let note2;
    it('POST /api/notes should create a new version of a note with a duplicate stix.id but different stix.modified date', function (done) {
        note2 = _.cloneDeep(note1);
        note2._id = undefined;
        note2.__t = undefined;
        note2.__v = undefined;
        const timestamp = new Date().toISOString();
        note2.stix.abstract = 'This is the abstract for a note.';
        note2.stix.content = 'Still a note. Parchment.'
        note2.stix.modified = timestamp;
        const body = note2;
        request(app)
            .post('/api/notes')
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
                    // We expect to get the created note
                    note2 = res.body;
                    expect(note2).toBeDefined();
                    done();
                }
            });
    });

    it('GET /api/notes should return the latest added note', function (done) {
        request(app)
            .get('/api/notes/' + note2.stix.id)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one note in an array
                    const notes = res.body;
                    expect(notes).toBeDefined();
                    expect(Array.isArray(notes)).toBe(true);
                    expect(notes.length).toBe(1);
                    const note = notes[0];
                    expect(note.stix.id).toBe(note2.stix.id);
                    expect(note.stix.modified).toBe(note2.stix.modified);
                    done();
                }
            });
    });

    let note3;
    it('POST /api/notes should create a new note with a new stix.id', function (done) {
        note3 = _.cloneDeep(note1);
        note3._id = undefined;
        note3.__t = undefined;
        note3.__v = undefined;
        note3.stix.id = undefined;
        const timestamp = new Date().toISOString();
        note3.stix.abstract = 'This is the abstract for a note.';
        note3.stix.content = 'Still a note.'
        note3.stix.modified = timestamp;
        const body = note3;
        request(app)
            .post('/api/notes')
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
                    // We expect to get the created note
                    note3 = res.body;
                    expect(note3).toBeDefined();
                    done();
                }
            });
    });

    let note4;
    it('POST /api/notes should create a new version of the last note with a duplicate stix.id but different stix.modified date', function (done) {
        note4 = _.cloneDeep(note3);
        note4._id = undefined;
        note4.__t = undefined;
        note4.__v = undefined;
        const timestamp = new Date().toISOString();
        note4.stix.abstract = 'This is the abstract for a note. Parchment';
        note4.stix.content = 'Still a note.'
        note4.stix.modified = timestamp;
        const body = note4;
        request(app)
            .post('/api/notes')
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
                    // We expect to get the created note
                    note4 = res.body;
                    expect(note4).toBeDefined();
                    done();
                }
            });
    });

    it('GET /api/notes/:id should return all versions of the first note', function (done) {
        request(app)
            .get('/api/notes/' + note1.stix.id + '?versions=all')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get two notes in an array
                    const notes = res.body;
                    expect(notes).toBeDefined();
                    expect(Array.isArray(notes)).toBe(true);
                    expect(notes.length).toBe(2);
                    done();
                }
            });
    });

    it('GET /api/notes/:id/modified/:modified should return the first added note', function (done) {
        request(app)
            .get('/api/notes/' + note1.stix.id + '/modified/' + note1.stix.modified)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one note in an array
                    const note = res.body;
                    expect(note).toBeDefined();
                    expect(note.stix).toBeDefined();
                    expect(note.stix.id).toBe(note1.stix.id);
                    expect(note.stix.modified).toBe(note1.stix.modified);
                    done();
                }
            });
    });

    it('GET /api/notes/:id/modified/:modified should return the second added note', function (done) {
        request(app)
            .get('/api/notes/' + note2.stix.id + '/modified/' + note2.stix.modified)
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one note in an array
                    const note = res.body;
                    expect(note).toBeDefined();
                    expect(note.stix).toBeDefined();
                    expect(note.stix.id).toBe(note2.stix.id);
                    expect(note.stix.modified).toBe(note2.stix.modified);
                    done();
                }
            });
    });

    it('GET /api/notes should return the latest version of all the notes', function (done) {
        request(app)
            .get('/api/notes/')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get two notes in an array
                    const notes = res.body;
                    expect(notes).toBeDefined();
                    expect(Array.isArray(notes)).toBe(true);
                    expect(notes.length).toBe(2);
                    done();
                }
            });
    });

    it('GET /api/notes uses the search parameter to return the latest version of both notes', function (done) {
        request(app)
            .get('/api/notes?search=PARCHMENT')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get two notes in an array
                    const notes = res.body;
                    expect(notes).toBeDefined();
                    expect(Array.isArray(notes)).toBe(true);
                    expect(notes.length).toBe(2);
                    done();
                }
            });
    });

    it('GET /api/notes should not get the first version of the note when using the search parameter', function (done) {
        request(app)
            .get('/api/notes?search=IVORY')
            .set('Accept', 'application/json')
            .set('Cookie', `${ login.passportCookieName }=${ passportCookie.value }`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get zero notes in an array
                    const notes = res.body;
                    expect(notes).toBeDefined();
                    expect(Array.isArray(notes)).toBe(true);
                    expect(notes.length).toBe(0);
                    done();
                }
            });
    });

    it('DELETE /api/notes/:id should not delete a note when the id cannot be found', function (done) {
        request(app)
            .delete('/api/notes/not-an-id')
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

    it('DELETE /api/notes/:id/modified/:modified should delete the first version of the note', function (done) {
        request(app)
            .delete('/api/notes/' + note1.stix.id + '/modified/' + note1.stix.modified)
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

    it('DELETE /api/notes/:id/modified/:modified should delete the second version of the note', function (done) {
        request(app)
            .delete('/api/notes/' + note2.stix.id + '/modified/' + note2.stix.modified)
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

    it('DELETE /api/notes/:id should delete all versions of the note', function (done) {
        request(app)
            .delete('/api/notes/' + note3.stix.id)
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

    it('GET /api/notes should return an empty array of notes', function (done) {
        request(app)
            .get('/api/notes')
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
                    const notes = res.body;
                    expect(notes).toBeDefined();
                    expect(Array.isArray(notes)).toBe(true);
                    expect(notes.length).toBe(0);
                    done();
                }
            });
    });

    after(async function() {
        await database.closeConnection();
    });
});

