'use strict';

const express = require('express');

const authnServiceController = require('../controllers/authn-service-controller');
const authnConfig = require('../lib/authn-configuration');

const router = express.Router();

router
  .route('/authn/service/apikey-challenge')
  .get(
    authnConfig.isServiceAuthenticationMechanismEnabled('challenge-apikey'),
    authnServiceController.apikeyGetChallenge,
  );

router
  .route('/authn/service/apikey-token')
  .get(
    authnConfig.isServiceAuthenticationMechanismEnabled('challenge-apikey'),
    authnServiceController.apikeyGetToken,
  );

module.exports = router;
