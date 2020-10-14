'use strict';

exports.initializeConnection = async function() {
    const logger = require('./logger');
    const config = require('../config/config');
    const mongoose = require('mongoose');

    // Configure mongoose to use ES6 promises
    mongoose.Promise = global.Promise;

    // Bootstrap db connection
    logger.info('Mongoose attempting to connect to ' + config.database.url);
    try {
        await mongoose.connect(config.database.url, {useNewUrlParser: true, useUnifiedTopology: true});
    } catch (error) {
        handleError(error);
    }
    logger.info('Mongoose connected to ' + config.database.url);

//    mongoose.connection.on('disconnected', function () {
//        logger.info('Mongoose disconnected from ' + config.database.url);
//    });

    function handleError(error) {
        logger.warn('Mongoose connection error: ' + error);
        logger.warn('Database (mongoose) connection is required. Terminating app.');

        // Terminate the app
        process.exit(1);
    }
}
