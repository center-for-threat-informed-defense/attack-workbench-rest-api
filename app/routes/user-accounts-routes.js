'use strict';

const express = require('express');
const userAccountsController = require('../controllers/user-accounts-controller');
const authn = require('../lib/authn-middleware');
const authz = require('../lib/authz-middleware');

const router = express.Router();

const adminRole = [ authz.roles.admin ];

router.route('/user-accounts')
    .get(
        authn.authenticate,
        authz.requireRole(adminRole),
        userAccountsController.retrieveAll
    )
    .post(
        authn.authenticate,
        authz.requireRole(adminRole),
        userAccountsController.create
    );

router.route('/user-accounts/:id')
    .get(
        authn.authenticate,
        authz.requireRole(adminRole),
        userAccountsController.retrieveById
    )
    .put(
        authn.authenticate,
        authz.requireRole(adminRole),
        userAccountsController.updateFull
    )
    .delete(
        authn.authenticate,
        authz.requireRole(adminRole),
        userAccountsController.delete
    );

router.route('/user-accounts/register')
    .post(
        authn.authenticate,
        authz.requireRole(adminRole),
        userAccountsController.register
    );

module.exports = router;
