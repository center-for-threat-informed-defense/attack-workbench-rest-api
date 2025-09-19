'use strict';

const express = require('express');

const { dataComponentSchema } = require('@mitre-attack/attack-data-model');

const dataComponentsController = require('../controllers/data-components-controller');
const authn = require('../lib/authn-middleware');
const authz = require('../lib/authz-middleware');
const { validateWorkspaceStixData } = require('../lib/validation-middleware');

const router = express.Router();

router
  .route('/data-components')
  .get(
    authn.authenticate,
    authz.requireRole(authz.visitorOrHigher, authz.readOnlyService),
    dataComponentsController.retrieveAll,
  )
  .post(
    authn.authenticate,
    authz.requireRole(authz.editorOrHigher),
    validateWorkspaceStixData(dataComponentSchema),
    dataComponentsController.create,
  );

router
  .route('/data-components/:stixId')
  .get(
    authn.authenticate,
    authz.requireRole(authz.visitorOrHigher, authz.readOnlyService),
    dataComponentsController.retrieveById,
  )
  .delete(authn.authenticate, authz.requireRole(authz.admin), dataComponentsController.deleteById);

router
  .route('/data-components/:stixId/modified/:modified')
  .get(
    authn.authenticate,
    authz.requireRole(authz.visitorOrHigher, authz.readOnlyService),
    dataComponentsController.retrieveVersionById,
  )
  .put(
    authn.authenticate,
    authz.requireRole(authz.editorOrHigher),
    validateWorkspaceStixData(dataComponentSchema),
    dataComponentsController.updateFull,
  )
  .delete(
    authn.authenticate,
    authz.requireRole(authz.admin),
    dataComponentsController.deleteVersionById,
  );

module.exports = router;
