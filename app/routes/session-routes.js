'use strict';

const express = require('express');
const sessionController = require('../controllers/session-controller');
const authnService = require('../services/authn-service');

const router = express.Router();

router.route('/session')
    .get(
        authnService.authenticate,
        sessionController.retrieveCurrentSession
    );

module.exports = router;
