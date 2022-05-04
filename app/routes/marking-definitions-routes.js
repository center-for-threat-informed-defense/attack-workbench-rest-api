'use strict';

const express = require('express');

const markingDefinitionsController = require('../controllers/marking-definitions-controller');
const authn = require('../lib/authn-middleware');
const authz = require('../lib/authz-middleware');

const router = express.Router();

router.route('/marking-definitions')
    .get(
        authn.authenticate,
        authz.requireRole(authz.visitorOrHigher, authz.readOnlyService),
        markingDefinitionsController.retrieveAll
    )
    .post(
        authn.authenticate,
        authz.requireRole(authz.editorOrHigher),
        markingDefinitionsController.create
    );

router.route('/marking-definitions/:stixId')
    .get(
        authn.authenticate,
        authz.requireRole(authz.visitorOrHigher, authz.readOnlyService),
        markingDefinitionsController.retrieveById
    )
    .put(
        authn.authenticate,
        authz.requireRole(authz.editorOrHigher),
        markingDefinitionsController.updateFull
    )
    .delete(
        authn.authenticate,
        authz.requireRole(authz.admin),
        markingDefinitionsController.delete
    );

module.exports = router;
