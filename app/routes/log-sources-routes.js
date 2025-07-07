'use strict';

const express = require('express');

const logSourcesController = require('../controllers/log-sources-controller');
const authn = require('../lib/authn-middleware');
const authz = require('../lib/authz-middleware');

const router = express.Router();

router
  .route('/log-sources')
  .get(
    authn.authenticate,
    authz.requireRole(authz.visitorOrHigher, authz.readOnlyService),
    logSourcesController.retrieveAll,
  )
  .post(authn.authenticate, authz.requireRole(authz.editorOrHigher), logSourcesController.create);

router
  .route('/log-sources/:stixId')
  .get(
    authn.authenticate,
    authz.requireRole(authz.visitorOrHigher, authz.readOnlyService),
    logSourcesController.retrieveById,
  )
  .delete(authn.authenticate, authz.requireRole(authz.admin), logSourcesController.deleteById);

router
  .route('/log-sources/:stixId/modified/:modified')
  .get(
    authn.authenticate,
    authz.requireRole(authz.visitorOrHigher, authz.readOnlyService),
    logSourcesController.retrieveVersionById,
  )
  .put(authn.authenticate, authz.requireRole(authz.editorOrHigher), logSourcesController.updateFull)
  .delete(
    authn.authenticate,
    authz.requireRole(authz.admin),
    logSourcesController.deleteVersionById,
  );

module.exports = router;
