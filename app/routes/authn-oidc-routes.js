'use strict';

const express = require('express');
const passport = require('passport');

const authnConfig = require('../lib/authn-configuration');
const authnOidc = require('../lib/authn-oidc');
const authnOidcController = require('../controllers/authn-oidc-controller');

const router = express.Router();
router.route('/authn/oidc/login')
    .get(
        authnConfig.isUserAuthenticationMechanismEnabled('oidc'),
        authnOidcController.login,
        passport.authenticate(authnOidc.strategyName()));

router.route('/authn/oidc/callback')
    .get(
        authnConfig.isUserAuthenticationMechanismEnabled('oidc'),
        passport.authenticate(authnOidc.strategyName(), { keepSessionInfo: true }),
        authnOidcController.identityProviderCallback);

router.route('/authn/oidc/logout')
    .get(
        authnConfig.isUserAuthenticationMechanismEnabled('oidc'),
        authnOidcController.logout
    );

module.exports = router;
