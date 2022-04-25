'use strict';

const express = require('express');

const sessionController = require('../controllers/session-controller');
const authn = require('../lib/authn-middleware');

const router = express.Router();

router.route('/session')
    .get(
        authn.authenticate,
        sessionController.retrieveCurrentSession
    );

module.exports = router;
