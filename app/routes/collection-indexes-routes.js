'use strict';

const express = require('express');
const collectionIndexesController = require('../controllers/collection-indexes-controller');
const authn = require('../lib/authn-middleware');
const authz = require('../lib/authz-middleware');

const router = express.Router();

router.route('/collection-indexes')
    .get(
        authn.authenticate,
        authz.requireRole(authz.visitorOrHigher),
        collectionIndexesController.retrieveAll
    )
    .post(
        authn.authenticate,
        authz.requireRole(authz.editorOrHigher),
        collectionIndexesController.create
    );

router.route('/collection-indexes/:id')
    .get(
        authn.authenticate,
        authz.requireRole(authz.visitorOrHigher),
        collectionIndexesController.retrieveById
    );

router.route('/collection-indexes/:id')
    .put(
        authn.authenticate,
        authz.requireRole(authz.editorOrHigher),
        collectionIndexesController.updateFull
    )
    .delete(
        authn.authenticate,
        authz.requireRole(authz.admin),
        collectionIndexesController.delete
    );

module.exports = router;
