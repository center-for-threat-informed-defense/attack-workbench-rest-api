'use strict';

exports.initializeConnection = async function(options) {
    const logger = require('./logger');
    const config = require('../config/config');

    const databaseUrl = options?.databaseUrl || config.database.url;

    if (!databaseUrl) {
        throw new Error('The URL for the MongoDB database was not set in the DATABASE_URL environment variable.');
    }

    const mongoose = require('mongoose');

    // Configure mongoose to use ES6 promises
    mongoose.Promise = global.Promise;

    // Tell mongoose to use the native mongoDB findOneAndUpdate() function
    mongoose.set('useFindAndModify', false);

    // Tell mongoose to use createIndex() instead of ensureIndex()
    mongoose.set('useCreateIndex', true);

    // Bootstrap db connection
    logger.info('Mongoose attempting to connect to ' + databaseUrl);
    await mongoose.connect(databaseUrl);

    logger.info('Mongoose connected to ' + databaseUrl);
}
