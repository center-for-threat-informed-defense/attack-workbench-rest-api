'use strict';

const express = require('express');
const authnServiceController = require('../controllers/authn-service-controller');

const router = express.Router();

router.route('/authn/service/login')
    .get(authnServiceController.login);

router.route('/authn/service/logout')
    .get(authnServiceController.logout);

module.exports = router;
