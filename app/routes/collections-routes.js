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

module.exports = router;
