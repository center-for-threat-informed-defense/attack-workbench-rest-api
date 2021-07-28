'use strict';

const express = require('express');
const authnAnonymousController = require('../controllers/authn-anonymous-controller');
const passport = require('passport');

const router = express.Router();

router.route('/authn/anonymous/login')
    .get(
        passport.authenticate('anonymId'),
        authnAnonymousController.login);

router.route('/authn/anonymous/logout')
    .get(authnAnonymousController.logout);

module.exports = router;
