'use strict';

const express = require('express');
const collectionsController = require('../controllers/collections-controller');

const router = express.Router();

router.route('/collections')
    .get(collectionsController.retrieveAll)

router.route('/collections/:id')
    .get(collectionsController.retrieveById);

module.exports = router;
