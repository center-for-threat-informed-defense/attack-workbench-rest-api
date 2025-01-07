'use strict';

const express = require('express');

const teamsController = require('../controllers/teams-controller');
const authn = require('../lib/authn-middleware');
const authz = require('../lib/authz-middleware');

const router = express.Router();

router
  .route('/teams')
  .get(authn.authenticate, authz.requireRole(authz.admin), teamsController.retrieveAll)
  .post(authn.authenticate, authz.requireRole(authz.admin), teamsController.create);

router
  .route('/teams/:id')
  .get(authn.authenticate, authz.requireRole(authz.admin), teamsController.retrieveById)
  .put(authn.authenticate, authz.requireRole(authz.admin), teamsController.updateFull)
  .delete(authn.authenticate, authz.requireRole(authz.admin), teamsController.delete);

router
  .route('/teams/:id/users')
  .get(authn.authenticate, authz.requireRole(authz.admin), teamsController.retrieveAllUsers);

module.exports = router;
