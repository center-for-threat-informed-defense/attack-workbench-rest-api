'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const OpenApiValidator = require('express-openapi-validator');
const techniquesRoutes = require('./techniques-routes');
const errorHandler = require('../lib/error-handler');
const config = require('../config/config');

const router = express.Router();

// Parse the request body
router.use('/api', bodyParser.json({limit: '1mb'}));
router.use('/api', bodyParser.urlencoded({ limit: '1mb', extended: true }));

// Setup request validation
router.use(OpenApiValidator.middleware({
    apiSpec: config.openApi.specPath,
    validateRequests: true,
    validateResponses: false
}));

// Set up the routes
router.use('/api', techniquesRoutes);

// Handle errors that haven't otherwise been caught
router.use(errorHandler.bodyParser);
router.use(errorHandler.requestValidation);
router.use(errorHandler.invalidPath);
router.use(errorHandler.catchAll);

module.exports = router;
