'use strict';

const express = require('express');

const stixBundlesController = require('../controllers/stix-bundles-controller');
const authn = require('../lib/authn-middleware');
const authz = require('../lib/authz-middleware');

const router = express.Router();

router.route('/stix-bundles')
    .get(
        authn.authenticate,
        authz.requireRole(authz.visitorOrHigher, authz.readOnlyService),
        stixBundlesController.exportBundle
    );

module.exports = router;
