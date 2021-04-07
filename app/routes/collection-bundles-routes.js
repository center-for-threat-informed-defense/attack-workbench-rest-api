'use strict';

const express = require('express');
const collectionBundlesController = require('../controllers/collection-bundles-controller');

const router = express.Router();

router.route('/collection-bundles')
    .get(collectionBundlesController.exportBundle)
    .post(collectionBundlesController.importBundle);

module.exports = router;
