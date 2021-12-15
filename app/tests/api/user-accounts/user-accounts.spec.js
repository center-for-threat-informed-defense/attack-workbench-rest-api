const request = require('supertest');
const expect = require('expect');

const logger = require('../../../lib/logger');
logger.level = 'debug';

const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');
const UserAccount = require('../../../models/user-account-model');

// userId property will be created by REST API
const initialObjectData = {
    email: 'user@org.com',
    username: 'UserFirst UserLast',
    status: 'active',
    role: 'editor'
};

describe('User Accounts API', function () {
    let app;

    before(async function() {
        // Establish the database connection
        // Use an in-memory database that we spin up for the test
        await database.initializeConnection();

        // Check for a valid database configuration
        await databaseConfiguration.checkSystemConfiguration();

        // Wait until the indexes are created
        await UserAccount.init();

        // Initialize the express app
        app = await require('../../../index').initializeApp();
    });

    it('GET /api/user-accounts returns an array with the anonymous user account', function (done) {
        request(app)
            .get('/api/user-accounts')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    // We expect to get an array with one entry (the anonymous user account)
                    const userAccounts = res.body;
                    expect(userAccounts).toBeDefined();
                    expect(Array.isArray(userAccounts)).toBe(true);
                    expect(userAccounts.length).toBe(1);

                    done();
                }
            });
    });

    it('POST /api/user-accounts does not create an empty user account', function (done) {
        const body = {};
        request(app)
            .post('/api/user-accounts')
            .send(body)
            .set('Accept', 'application/json')
            .expect(400)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    done();
                }
            });
    });

    let userAccount1;
    it('POST /api/user-accounts creates a user account', function (done) {
        const body = initialObjectData;
        request(app)
            .post('/api/user-accounts')
            .send(body)
            .set('Accept', 'application/json')
            .expect(201)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    // We expect to get the created user account
                    userAccount1 = res.body;
                    expect(userAccount1).toBeDefined();
                    expect(userAccount1.id).toBeDefined();
                    done();
                }
            });
    });

    it('GET /api/user-accounts returns the added user account', function (done) {
        request(app)
            .get('/api/user-accounts')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    // We expect to get the added user account and the anonymous user account
                    const userAccounts = res.body;
                    expect(userAccounts).toBeDefined();
                    expect(Array.isArray(userAccounts)).toBe(true);
                    expect(userAccounts.length).toBe(2);
                    done();
                }
            });
    });

    it('GET /api/user-accounts/:id should not return a user account when the id cannot be found', function (done) {
        request(app)
            .get('/api/user-accounts/not-an-id')
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

    it('GET /api/user-accounts/:id returns the added user account', function (done) {
        request(app)
            .get('/api/user-accounts/' + userAccount1.id)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    // We expect to get one user account in an array
                    const userAccount = res.body;
                    expect(userAccount).toBeDefined();
                    expect(userAccount.id).toBe(userAccount1.id);
                    expect(userAccount.email).toBe(userAccount1.email);
                    expect(userAccount.username).toBe(userAccount1.username);
                    expect(userAccount.status).toBe(userAccount1.status);
                    expect(userAccount.role).toBe(userAccount1.role);

                    done();
                }
            });
    });

    it('PUT /api/user-accounts updates a user account', function (done) {
        const body = userAccount1;
        body.role = 'admin';
        request(app)
            .put('/api/user-accounts/' + userAccount1.id)
            .send(body)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    // We expect to get the updated user account
                    const userAccount = res.body;
                    expect(userAccount).toBeDefined();
                    expect(userAccount.identity).toBe(userAccount1.identity);
                    done();
                }
            });
    });

    it('GET /api/user-accounts uses the search parameter to return the user account', function (done) {
        request(app)
            .get('/api/user-accounts?search=first')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get one user account in an array
                    const userAccounts = res.body;
                    expect(userAccounts).toBeDefined();
                    expect(Array.isArray(userAccounts)).toBe(true);
                    expect(userAccounts.length).toBe(1);

                    done();
                }
            });
    });

    it('POST /api/user-accounts does not create a user account with a duplicate email', function (done) {
        const body = initialObjectData;
        request(app)
            .post('/api/user-accounts')
            .send(body)
            .set('Accept', 'application/json')
            .expect(400)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    done();
                }
            });
    });

    it('DELETE /api/user-accounts deletes a user account', function (done) {
        request(app)
            .delete('/api/user-accounts/' + userAccount1.id)
            .expect(204)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    done();
                }
            });
    });

    it('GET /api/user-accounts returns an array with the anonymous user account', function (done) {
        request(app)
            .get('/api/user-accounts')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    // We expect to get an empty array
                    const userAccount = res.body;
                    expect(userAccount).toBeDefined();
                    expect(Array.isArray(userAccount)).toBe(true);
                    expect(userAccount.length).toBe(1);
                    done();
                }
            });
    });

    after(async function() {
        await database.closeConnection();
    });
});
