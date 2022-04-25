'use strict';

const express = require('express');

const collectionsController = require('../controllers/collections-controller');
const authn = require('../lib/authn-middleware');
const authz = require('../lib/authz-middleware');

const router = express.Router();

router.route('/collections')
    .get(
        authn.authenticate,
        authz.requireRole(authz.visitorOrHigher),
        collectionsController.retrieveAll
    )
    .post(
        authn.authenticate,
        authz.requireRole(authz.editorOrHigher),
        collectionsController.create
    );

router.route('/collections/:stixId')
    .get(
        authn.authenticate,
        authz.requireRole(authz.visitorOrHigher),
        collectionsController.retrieveById
    )
    .delete(
        authn.authenticate,
        authz.requireRole(authz.admin),
        collectionsController.delete
    );

router.route('/collections/:stixId/modified/:modified')
    .get(
        authn.authenticate,
        authz.requireRole(authz.visitorOrHigher),
        collectionsController.retrieveVersionById
    );

module.exports = router;
