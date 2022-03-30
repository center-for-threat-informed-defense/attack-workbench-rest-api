'use strict';

const express = require('express');
const attackObjectsController = require('../controllers/attack-objects-controller');
const authnService = require('../services/authn-service');
const authzService = require('../services/authz-service');

const router = express.Router();
const adminEditorVisitorRole = [ authzService.roles.admin, authzService.roles.editor, authzService.roles.visitor ];

router.route('/attack-objects')
    .get(
        authnService.authenticate,
        authzService.requireRole(adminEditorVisitorRole),
        attackObjectsController.retrieveAll
    );

module.exports = router;
