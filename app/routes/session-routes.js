'use strict';

const express = require('express');
const sessionController = require('../controllers/session-controller');
const authnBearer = require('../lib/authn-bearer');

const router = express.Router();

router.route('/session')
    .get(
        authnBearer.authenticate,
        sessionController.retrieveCurrentSession
    );

module.exports = router;
