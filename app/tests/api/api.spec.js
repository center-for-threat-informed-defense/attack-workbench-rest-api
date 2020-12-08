const request = require('supertest');
const database = require('../../lib/database-in-memory')
const expect = require('expect');
const _ = require('lodash');

const techniquesService = require('../../services/techniques-service');

const logger = require('../../lib/logger');
logger.level = 'debug';

let app;
before(async function() {
    // Establish the database connection
    // Use an in-memory database that we spin up for the test
    await database.initializeConnection();

    // Create the app
    app = require('../../index');
});

describe('Techniques API Specs', function () {
    require('../specs/techniques.spec');
    require('../specs/techniques-pagination.spec');
});

after(async function() {
    await database.closeConnection();
});
