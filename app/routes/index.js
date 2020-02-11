'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const OpenApiValidator = require('express-openapi-validator').OpenApiValidator;
const techniqueRoutes = require('./technique-routes');
const errorHandler = require('../lib/error-handler');

const router = express.Router();

// Parse the request body
router.use('/api', bodyParser.json({limit: '1mb'}));
router.use('/api', bodyParser.urlencoded({ limit: '1mb', extended: true }));

// Setup request validation
const validator = new OpenApiValidator({ apiSpec: './app/api/definitions/api.yml' });
validator.installSync(router);

// Set up the routes
router.use('/api', techniqueRoutes);

// Handle errors that haven't otherwise been caught
router.use(errorHandler.bodyParser);
router.use(errorHandler.requestValidation);
router.use(errorHandler.catchAll);

module.exports = router;
