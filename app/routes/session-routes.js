'use strict';

const express = require('express');
const sessionController = require('../controllers/session-controller');

const router = express.Router();

router.route('/session')
    .get(sessionController.retrieveCurrentSession);

module.exports = router;
