'use strict';

const express = require('express');

const techniquesController = require('../controllers/techniques-controller');
const authn = require('../lib/authn-middleware');
const authz = require('../lib/authz-middleware');
const validateTechniqueForSpecCompliance = require('../middleware/technique-validation-middleware');

const router = express.Router();

router
  .route('/techniques')
  .get(
    authn.authenticate,
    authz.requireRole(authz.visitorOrHigher, authz.readOnlyService),
    techniquesController.retrieveAll,
  )
  .post(
    authn.authenticate,
    authz.requireRole(authz.editorOrHigher),
    validateTechniqueForSpecCompliance, // Reject if req.body.stix is not compliant with ADM
    techniquesController.create,
  );

router
  .route('/techniques/:stixId')
  .get(
    authn.authenticate,
    authz.requireRole(authz.visitorOrHigher, authz.readOnlyService),
    techniquesController.retrieveById,
  )
  .delete(authn.authenticate, authz.requireRole(authz.admin), techniquesController.deleteById);

router
  .route('/techniques/:stixId/modified/:modified')
  .get(
    authn.authenticate,
    authz.requireRole(authz.visitorOrHigher, authz.readOnlyService),
    techniquesController.retrieveVersionById,
  )
  .put(
    authn.authenticate,
    authz.requireRole(authz.editorOrHigher),
    validateTechniqueForSpecCompliance, // Reject if req.body.stix is not compliant with ADM
    techniquesController.updateFull,
  )
  .delete(
    authn.authenticate,
    authz.requireRole(authz.admin),
    techniquesController.deleteVersionById,
  );

router
  .route('/techniques/:stixId/modified/:modified/tactics')
  .get(
    authn.authenticate,
    authz.requireRole(authz.visitorOrHigher, authz.readOnlyService),
    techniquesController.retrieveTacticsForTechnique,
  );

module.exports = router;
