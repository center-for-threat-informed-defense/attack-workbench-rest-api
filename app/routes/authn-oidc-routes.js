'use strict';

const express = require('express');
const authnOidcController = require('../controllers/authn-oidc-controller');

const router = express.Router();

router.route('/authn/oidc/login')
    .get(authnOidcController.login);

router.route('/authn/oidc/callback')
    .get(authnOidcController.identityProviderCallback);

router.route('/authn/oidc/logout')
    .get(authnOidcController.logout);

module.exports = router;
