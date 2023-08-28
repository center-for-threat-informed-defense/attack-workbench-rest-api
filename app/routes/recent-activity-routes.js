'use strict';

const express = require('express');

const recentActivityController = require('../controllers/recent-activity-controller');
const authn = require('../lib/authn-middleware');
const authz = require('../lib/authz-middleware');

const router = express.Router();

router.route('/recent-activity')
    .get(
        authn.authenticate,
        authz.requireRole(authz.visitorOrHigher, authz.readOnlyService),
        recentActivityController.retrieveAll
    );

module.exports = router;
