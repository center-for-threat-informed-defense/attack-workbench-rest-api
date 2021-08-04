'use strict';

const express = require('express');
const passport = require('passport');
const config = require('../config/config');
const authnOidcController = require('../controllers/authn-oidc-controller');

const router = express.Router();

router.route('/authn/oidc/login')
    .get(
        authnOidcController.login,
        passport.authenticate(config.authn.strategyName));

router.route('/authn/oidc/callback')
    .get(
        passport.authenticate(config.authn.strategyName),
        authnOidcController.identityProviderCallback);

router.route('/authn/oidc/logout')
    .get(authnOidcController.logout);

module.exports = router;
