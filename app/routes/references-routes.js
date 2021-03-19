'use strict';

const express = require('express');
const referencesController = require('../controllers/references-controller');

const router = express.Router();

router.route('/references')
    .get(referencesController.retrieveAll)
    .post(referencesController.create)
    .put(referencesController.update);

module.exports = router;
