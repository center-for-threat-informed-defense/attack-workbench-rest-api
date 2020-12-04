'use strict';

// Configure the logger
const logger = require('./app/lib/logger');

logger.info('ATT&CK Workbench REST API app starting');

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
const config = require('./app/config/config');

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

// Establish the database connection
logger.info('Setting up the database connection');
require('./app/lib/dbConnection');

// Only use request logger for development environment
if (config.app.env === 'development') {
    logger.info('Enabling request logging');
    var morgan = require('morgan');
    app.use(morgan('dev', { stream : logger.stream }));
}

// Set up the static routes
app.use(express.static('public'));

// Set up the api routes
logger.info('Creating the routes');
const routes = require('./app/routes');
app.use(routes);

// Start the server
const server = app.listen(config.server.port, function () {
    const host = server.address().address;
    const port = server.address().port;

    logger.info(`Listening at http://${host}:${port}`);
    logger.info('ATT&CK Workbench REST API start up complete');
});

module.exports = app;
