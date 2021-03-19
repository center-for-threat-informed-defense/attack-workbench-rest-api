'use strict';

const express = require('express');
const systemConfigurationController = require('../controllers/system-configuration-controller');

const router = express.Router();

router.route('/config/allowed-values')
    .get(systemConfigurationController.retrieveAllowedValues);

module.exports = router;
