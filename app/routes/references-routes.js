'use strict';

const express = require('express');

const referencesController = require('../controllers/references-controller');
const authn = require('../lib/authn-middleware');
const authz = require('../lib/authz-middleware');

const router = express.Router();

router
  .route('/references')
  .get(
    authn.authenticate,
    authz.requireRole(authz.visitorOrHigher, authz.readOnlyService),
    referencesController.retrieveAll,
  )
  .post(authn.authenticate, authz.requireRole(authz.editorOrHigher), referencesController.create)
  .put(authn.authenticate, authz.requireRole(authz.editorOrHigher), referencesController.update)
  .delete(
    authn.authenticate,
    authz.requireRole(authz.editorOrHigher),
    referencesController.deleteBySourceName,
  );

module.exports = router;
