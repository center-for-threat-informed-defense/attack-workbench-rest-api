'use strict';

const express = require('express');

const collectionBundlesController = require('../controllers/collection-bundles-controller');
const authn = require('../lib/authn-middleware');
const authz = require('../lib/authz-middleware');

const router = express.Router();

router.route('/collection-bundles')
    .get(
        authn.authenticate,
        authz.requireRole(authz.visitorOrHigher),
        collectionBundlesController.exportBundle
    )
    .post(
        authn.authenticate,
        authz.requireRole(authz.editorOrHigher),
        collectionBundlesController.importBundle
    );

module.exports = router;
