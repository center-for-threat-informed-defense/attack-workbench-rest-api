'use strict';

const express = require('express');
const authnConfig = require('../lib/authn-configuration');
const authnAnonymousController = require('../controllers/authn-anonymous-controller');

const router = express.Router();

router.route('/authn/anonymous/login')
    .get(
        authnConfig.checkAuthenticationMechanism('anonymous'),
        authnConfig.authenticate,
        authnAnonymousController.login);

router.route('/authn/anonymous/logout')
    .get(
        authnConfig.checkAuthenticationMechanism('anonymous'),
        authnAnonymousController.logout
    );

module.exports = router;
