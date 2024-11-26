'use strict';

const express = require('express');

const healthController = require('../controllers/health-controller');
const authn = require('../lib/authn-middleware');
const authz = require('../lib/authz-middleware');

const router = express.Router();

router.route('/health/ping')
    .get(
        // No authentication or authorization required
        healthController.getPing
    );

router.route('/health/status')
    .get(
        authn.authenticate,
        authz.requireRole(authz.visitorOrHigher, authz.readOnlyService),
        healthController.getStatus
    );

module.exports = router;
