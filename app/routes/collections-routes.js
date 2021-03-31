'use strict';

const express = require('express');
const collectionsController = require('../controllers/collections-controller');

const router = express.Router();

router.route('/collections')
    .get(collectionsController.retrieveAll)
    .post(collectionsController.create);

router.route('/collections/:stixId')
    .get(collectionsController.retrieveById)
    .delete(collectionsController.delete);

router.route('/collections/:stixId/modified/:modified')
    .get(collectionsController.retrieveVersionById);

module.exports = router;
