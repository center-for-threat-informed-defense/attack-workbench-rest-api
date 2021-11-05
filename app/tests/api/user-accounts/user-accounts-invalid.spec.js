const request = require('supertest');

const logger = require('../../../lib/logger');
logger.level = 'debug';

const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');

const userAccounts = require('./user-accounts.invalid.json');

describe('User Accounts API Test Invalid Data', function () {
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

    for (const userAccountData of userAccounts) {
        it(`POST /api/user-accounts does not create a user account with invalid data (${ userAccountData.username })`, async function () {
            const body = userAccountData;
            await request(app)
                .post('/api/user-accounts')
                .send(body)
                .set('Accept', 'application/json')
                .expect(400);
        });
    }

    after(async function() {
        await database.closeConnection();
    });
});
