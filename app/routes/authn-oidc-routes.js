'use strict';

const express = require('express');
const authnConfig = require('../lib/authn-configuration');
const authnOidcController = require('../controllers/authn-oidc-controller');

const router = express.Router();

router.route('/authn/oidc/login')
    .get(
        authnConfig.checkAuthenticationMechanism('oidc'),
        authnOidcController.login,
        authnConfig.authenticate);

router.route('/authn/oidc/callback')
    .get(
        authnConfig.checkAuthenticationMechanism('oidc'),
        authnConfig.authenticate,
        authnOidcController.identityProviderCallback);

router.route('/authn/oidc/logout')
    .get(
        authnConfig.checkAuthenticationMechanism('oidc'),
        authnOidcController.logout
    );

module.exports = router;
