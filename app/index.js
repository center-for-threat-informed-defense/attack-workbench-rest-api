'use strict';

exports.initializeApp = async function() {
    const logger = require('./lib/logger');
    logger.info('Federated ATT&CK REST API app starting');

    const os = require('os');
    logger.info('** hostname = ' + os.hostname());
    logger.info('** type = ' + os.type());
    logger.info('** platform = ' + os.platform());
    logger.info('** arch = ' + os.arch());
    logger.info('** release = ' + os.release());
    logger.info('** uptime = ' + os.uptime());
    logger.info('** versions = ' + JSON.stringify(process.versions));

    // Configure the app
    logger.info('Configuring the app');
    const config = require('./config/config');

    // Create the express application
    logger.info('Starting express');
    const express = require('express');
    const app = express();

    // Compress response bodies
    const compression = require('compression');
    app.use(compression());

    // Set HTTP response headers
    const helmet = require("helmet");
    app.use(helmet());

    // Only use request logger for development environment
    if (config.app.env === 'development') {
        logger.info('Enabling request logging');
        const morgan = require('morgan');
        app.use(morgan('dev', {stream: logger.stream}));
    }

    // Set up the static routes
    app.use(express.static('public'));

    // Set up the api routes
    logger.info('Creating the routes');
    const routes = require('./routes');
    app.use(routes);

    // Make the config and logger accessible from the app
    app.set('config', config);
    app.set('logger', logger);

    return app;
}
