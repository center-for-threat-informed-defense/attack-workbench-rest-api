'use strict';

const express = require('express');
const stixBundlesController = require('../controllers/stix-bundles-controller');

const router = express.Router();

router.route('/stix-bundles')
    .get(stixBundlesController.exportBundle);

module.exports = router;
