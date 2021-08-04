'use strict';

const express = require('express');
const passport = require('passport');
const config = require('../config/config');
const authnAnonymousController = require('../controllers/authn-anonymous-controller');

const router = express.Router();

router.route('/authn/anonymous/login')
    .get(
        passport.authenticate(config.authn.strategyName),
        authnAnonymousController.login);

router.route('/authn/anonymous/logout')
    .get(authnAnonymousController.logout);

module.exports = router;
