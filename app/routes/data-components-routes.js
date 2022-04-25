'use strict';

const express = require('express');

const dataComponentsController = require('../controllers/data-components-controller');
const authn = require('../lib/authn-middleware');
const authz = require('../lib/authz-middleware');

const router = express.Router();

router.route('/data-components')
    .get(
        authn.authenticate,
        authz.requireRole(authz.visitorOrHigher),
        dataComponentsController.retrieveAll
    )
    .post(
        authn.authenticate,
        authz.requireRole(authz.editorOrHigher),
        dataComponentsController.create
    );

router.route('/data-components/:stixId')
    .get(
        authn.authenticate,
        authz.requireRole(authz.visitorOrHigher),
        dataComponentsController.retrieveById
    );

router.route('/data-components/:stixId/modified/:modified')
    .get(
        authn.authenticate,
        authz.requireRole(authz.visitorOrHigher),
        dataComponentsController.retrieveVersionById
    )
    .put(
        authn.authenticate,
        authz.requireRole(authz.editorOrHigher),
        dataComponentsController.updateFull
    )
    .delete(
        authn.authenticate,
        authz.requireRole(authz.admin),
        dataComponentsController.delete
    );

module.exports = router;
