'use strict';

const express = require('express');

const collectionIndexesController = require('../controllers/collection-indexes-controller');
const authn = require('../lib/authn-middleware');
const authz = require('../lib/authz-middleware');

const router = express.Router();

router
  .route('/collection-indexes')
  .get(
    authn.authenticate,
    authz.requireRole(authz.visitorOrHigher, [
      authz.serviceRoles.readOnly,
      authz.serviceRoles.collectionManager,
    ]),
    collectionIndexesController.retrieveAll,
  )
  .post(
    authn.authenticate,
    authz.requireRole(authz.editorOrHigher),
    collectionIndexesController.create,
  );

router
  .route('/collection-indexes/:id')
  .get(
    authn.authenticate,
    authz.requireRole(authz.visitorOrHigher, authz.readOnlyService),
    collectionIndexesController.retrieveById,
  )
  .put(
    authn.authenticate,
    authz.requireRole(authz.editorOrHigher, [authz.serviceRoles.collectionManager]),
    collectionIndexesController.updateFull,
  )
  .delete(authn.authenticate, authz.requireRole(authz.admin), collectionIndexesController.delete);

router
  .route('/collection-indexes/:id/refresh')
  .post(
    authn.authenticate,
    authz.requireRole(authz.editorOrHigher),
    collectionIndexesController.refresh,
  );

module.exports = router;
