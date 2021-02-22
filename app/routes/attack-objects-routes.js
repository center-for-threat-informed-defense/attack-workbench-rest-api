'use strict';

const express = require('express');
const attackObjectsController = require('../controllers/attack-objects-controller');

const router = express.Router();

router.route('/attack-objects')
    .get(attackObjectsController.retrieveAll);

module.exports = router;
