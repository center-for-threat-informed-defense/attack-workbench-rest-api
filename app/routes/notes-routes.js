'use strict';

const express = require('express');

const notesController = require('../controllers/notes-controller');
const authn = require('../lib/authn-middleware');
const authz = require('../lib/authz-middleware');

const router = express.Router();

router.route('/notes')
    .get(
        authn.authenticate,
        authz.requireRole(authz.visitorOrHigher, authz.readOnlyService),
        notesController.retrieveAll
    )
    .post(
        authn.authenticate,
        authz.requireRole(authz.editorOrHigher),
        notesController.create
    );

router.route('/notes/:stixId')
    .get(
        authn.authenticate,
        authz.requireRole(authz.visitorOrHigher, authz.readOnlyService),
        notesController.retrieveById
    )
    .delete(
        authn.authenticate,
        authz.requireRole(authz.editorOrHigher),
        notesController.deleteById
    );

router.route('/notes/:stixId/modified/:modified')
    .get(
        authn.authenticate,
        authz.requireRole(authz.visitorOrHigher, authz.readOnlyService),
        notesController.retrieveVersionById
    )
    .put(
        authn.authenticate,
        authz.requireRole(authz.editorOrHigher),
        notesController.updateVersion
    )
    .delete(
        authn.authenticate,
        authz.requireRole(authz.editorOrHigher),
        notesController.deleteVersionById
    );

module.exports = router;
