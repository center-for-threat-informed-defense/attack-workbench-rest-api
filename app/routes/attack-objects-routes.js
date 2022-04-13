'use strict';

const express = require('express');
const attackObjectsController = require('../controllers/attack-objects-controller');
const authn = require('../lib/authn-middleware');
const authz = require('../lib/authz-middleware');

const router = express.Router();
const adminEditorVisitorRole = [ authz.roles.admin, authz.roles.editor, authz.roles.visitor ];

router.route('/attack-objects')
    .get(
        authn.authenticate,
        authz.requireRole(adminEditorVisitorRole),
        attackObjectsController.retrieveAll
    );

module.exports = router;
