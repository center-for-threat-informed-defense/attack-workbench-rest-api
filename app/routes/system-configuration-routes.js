'use strict';

const express = require('express');
const systemConfigurationController = require('../controllers/system-configuration-controller');

const router = express.Router();

router.route('/config/system-version')
    .get(systemConfigurationController.retrieveSystemVersion);

router.route('/config/allowed-values')
    .get(systemConfigurationController.retrieveAllowedValues);

router.route('/config/organization-identity')
    .get(systemConfigurationController.retrieveOrganizationIdentity)
    .post(systemConfigurationController.setOrganizationIdentity);

module.exports = router;
