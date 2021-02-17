'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const OpenApiValidator = require('express-openapi-validator');

const techniquesRoutes = require('./techniques-routes');
const tacticsRoutes = require('./tactics-routes');
const groupsRoutes = require('./groups-routes');
const softwareRoutes = require('./software-routes');
const mitigationsRoutes = require('./mitigations-routes');
const matricesRoutes = require('./matrices-routes');
const identitiesRoutes = require('./identities-routes');
const markingDefinitionsRoutes = require('./marking-definitions-routes');
const relationshipsRoutes = require('./relationships-routes');
const collectionIndexesRoutes = require('./collection-indexes-routes');
const collectionsRoutes = require('./collections-routes');
const collectionBundlesRoutes = require('./collection-bundles-routes');
const systemConfigurationRoutes = require('./system-configuration-routes');

const errorHandler = require('../lib/error-handler');
const config = require('../config/config');

const router = express.Router();

// Parse the request body
router.use('/api', bodyParser.json({limit: '50mb'}));
router.use('/api', bodyParser.urlencoded({ limit: '1mb', extended: true }));

// Setup request validation
router.use(OpenApiValidator.middleware({
    apiSpec: config.openApi.specPath,
    validateRequests: true,
    validateResponses: false
}));

// Set up the routes
router.use('/api', techniquesRoutes);
router.use('/api', tacticsRoutes);
router.use('/api', groupsRoutes);
router.use('/api', softwareRoutes);
router.use('/api', mitigationsRoutes);
router.use('/api', matricesRoutes);
router.use('/api', identitiesRoutes);
router.use('/api', markingDefinitionsRoutes);
router.use('/api', relationshipsRoutes);
router.use('/api', collectionIndexesRoutes);
router.use('/api', collectionsRoutes);
router.use('/api', collectionBundlesRoutes);
router.use('/api', systemConfigurationRoutes);

// Handle errors that haven't otherwise been caught
router.use(errorHandler.bodyParser);
router.use(errorHandler.requestValidation);
router.use(errorHandler.catchAll);

module.exports = router;
