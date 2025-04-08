'use strict';

const express = require('express');

const collectionBundlesController = require('../controllers/collection-bundles-controller');
const authn = require('../lib/authn-middleware');
const authz = require('../lib/authz-middleware');

const router = express.Router();

router
  .route('/collection-bundles')
  .get(
    authn.authenticate,
    authz.requireRole(authz.visitorOrHigher, authz.readOnlyService),
    collectionBundlesController.exportBundle,
  )
  .post(
    authn.authenticate,
    authz.requireRole(authz.editorOrHigher, [authz.serviceRoles.collectionManager]),
    collectionBundlesController.importBundle,
  );

module.exports = router;
