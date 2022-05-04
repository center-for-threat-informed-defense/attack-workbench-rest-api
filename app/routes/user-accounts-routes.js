'use strict';

const express = require('express');

const userAccountsController = require('../controllers/user-accounts-controller');
const authn = require('../lib/authn-middleware');
const authz = require('../lib/authz-middleware');

const router = express.Router();

router.route('/user-accounts')
    .get(
        authn.authenticate,
        authz.requireRole(authz.admin),
        userAccountsController.retrieveAll
    )
    .post(
        authn.authenticate,
        authz.requireRole(authz.admin),
        userAccountsController.create
    );

router.route('/user-accounts/:id')
    .get(
        authn.authenticate,
        authz.requireRole(authz.editorOrHigher),
        userAccountsController.retrieveById
    )
    .put(
        authn.authenticate,
        authz.requireRole(authz.admin),
        userAccountsController.updateFull
    )
    .delete(
        authn.authenticate,
        authz.requireRole(authz.admin),
        userAccountsController.delete
    );

router.route('/user-accounts/register')
    .post(
        // authn and authz handled in controller
        userAccountsController.register
    );

module.exports = router;
