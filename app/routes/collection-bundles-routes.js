'use strict';

const express = require('express');
const collectionBundlesController = require('../controllers/collection-bundles-controller');

const router = express.Router();

router.route('/collection-bundles')
    .post(collectionBundlesController.import);

module.exports = router;
