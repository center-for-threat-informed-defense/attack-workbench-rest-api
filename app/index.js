'use strict';

/**
 * Do not set the upgrade-insecure-requests directive on the Content-Security-Policy header
 * @param {object} app - express app
 * @param {object} helmet - helmet module
 */
function disableUpgradeInsecureRequests(app, helmet) {
    const defaultDirectives = helmet.contentSecurityPolicy.getDefaultDirectives();
    delete defaultDirectives['upgrade-insecure-requests'];

    app.use(helmet.contentSecurityPolicy({
        directives: {
            ...defaultDirectives,
        },
    }));
}

/**
 * Creates a new instance of the express app.
 * @return The new express app
 */
exports.initializeApp = async function() {
    const logger = require('./lib/logger');
    logger.info('ATT&CK Workbench REST API app starting');

    // Configure the app
    logger.info('Configuring the app');
    const config = require('./config/config');

    // Create the express application
    logger.info('Starting express');
    const express = require('express');
    const app = express();

    // Allow CORS
    if (config.server.enableCorsAnyOrigin) {
        logger.info('CORS is enabled');
        const cors = require('cors');
        const corsOptions = {
            credentials: true,
            origin: true
        };
        app.use(cors(corsOptions));
    }
    else {
        logger.info('CORS is not enabled');
    }

    // Compress response bodies
    const compression = require('compression');
    app.use(compression());

    // Set HTTP response headers
    const helmet = require("helmet");
    app.use(helmet());
    disableUpgradeInsecureRequests(app, helmet);

    // Development Environment
    if (config.app.env === 'development') {
        // Enable request logging
        logger.info('Enabling HTTP request logging');
        const morgan = require('morgan');
        app.use(morgan('dev', {stream: logger.stream}));

        // Enable Swagger UI
        logger.info('Enabling Swagger UI');
        const swaggerUi = require('swagger-ui-express');
        const refParser = require("@apidevtools/json-schema-ref-parser");
        const openApiDoc = await refParser.dereference(config.openApi.specPath);
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDoc));
    }

    // Configure server-side sessions
    // TBD: Replace default MemoryStore with production quality session storage
    const session = require('express-session');
    const sessionOptions = {
        secret: config.session.secret,
        resave: false,
        saveUninitialized: false
    }
    app.use(session(sessionOptions));

    // Set up the static routes
    logger.info('Configuring static routes');
    app.use(express.static('public'));

    // Configure passport with the user authentication mechanism
    const authnConfiguration = require('./lib/authn-configuration');
    if (config.userAuthn.mechanism === 'oidc') {
        await authnConfiguration.configurePassport('oidc');
    }
    else if (config.userAuthn.mechanism === 'anonymous') {
        await authnConfiguration.configurePassport('anonymous');
    }

    // Configure passport for service authentication if enabled
    if (config.serviceAuthn.oidcClientCredentials.enable || config.serviceAuthn.apikey.enable) {
        await authnConfiguration.configurePassport('bearer');
    }

    // Set up the api routes
    logger.info('Configuring REST API routes');
    const routes = require('./routes');
    app.use(routes);

    // Make the config and logger objects accessible from the app object
    app.set('config', config);
    app.set('logger', logger);

    return app;
}
