'use strict';

const express = require('express');

const tacticsController = require('../controllers/tactics-controller');
const authn = require('../lib/authn-middleware');
const authz = require('../lib/authz-middleware');

const router = express.Router();

router.route('/tactics')
    .get(
        authn.authenticate,
        authz.requireRole(authz.visitorOrHigher),
        tacticsController.retrieveAll
    )
    .post(
        authn.authenticate,
        authz.requireRole(authz.editorOrHigher),
        tacticsController.create
    );

router.route('/tactics/:stixId')
    .get(
        authn.authenticate,
        authz.requireRole(authz.visitorOrHigher),
        tacticsController.retrieveById
    );

router.route('/tactics/:stixId/modified/:modified')
    .get(
        authn.authenticate,
        authz.requireRole(authz.visitorOrHigher),
        tacticsController.retrieveVersionById
    )
    .put(
        authn.authenticate,
        authz.requireRole(authz.editorOrHigher),
        tacticsController.updateFull
    )
    .delete(
        authn.authenticate,
        authz.requireRole(authz.admin),
        tacticsController.delete
    );

module.exports = router;
