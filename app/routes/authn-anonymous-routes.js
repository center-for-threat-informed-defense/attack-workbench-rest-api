'use strict';

const express = require('express');
const passport = require("passport");

const authnConfig = require('../lib/authn-configuration');
const authnAnonymous = require('../lib/authn-anonymous');
const authnAnonymousController = require('../controllers/authn-anonymous-controller');

const router = express.Router();

router.route('/authn/anonymous/login')
    .get(
        authnConfig.isUserAuthenticationMechanismEnabled('anonymous'),
        passport.authenticate(authnAnonymous.strategyName()),
        authnAnonymousController.login);

router.route('/authn/anonymous/logout')
    .get(
        authnConfig.isUserAuthenticationMechanismEnabled('anonymous'),
        authnAnonymousController.logout
    );

module.exports = router;
