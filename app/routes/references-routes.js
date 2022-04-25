'use strict';

const express = require('express');

const referencesController = require('../controllers/references-controller');
const authn = require('../lib/authn-middleware');
const authz = require('../lib/authz-middleware');

const router = express.Router();

router.route('/references')
    .get(
        authn.authenticate,
        authz.requireRole(authz.visitorOrHigher),
        referencesController.retrieveAll
    )
    .post(
        authn.authenticate,
        authz.requireRole(authz.editorOrHigher),
        referencesController.create
    )
    .put(
        authn.authenticate,
        authz.requireRole(authz.editorOrHigher),
        referencesController.update
    );

module.exports = router;
