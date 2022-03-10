'use strict';

const express = require('express');
const userAccountsController = require('../controllers/user-accounts-controller');
const authnService = require('../services/authn-service');
const authzService = require('../services/authz-service');

const router = express.Router();

const adminRole = [ authzService.roles.admin ];

router.route('/user-accounts')
    .get(
        authnService.authenticate,
        authzService.requireRole(adminRole),
        userAccountsController.retrieveAll
    )
    .post(
        authnService.authenticate,
        authzService.requireRole(adminRole),
        userAccountsController.create
    );

router.route('/user-accounts/:id')
    .get(
        authnService.authenticate,
        authzService.requireRole(adminRole),
        userAccountsController.retrieveById
    )
    .put(
        authnService.authenticate,
        authzService.requireRole(adminRole),
        userAccountsController.updateFull
    )
    .delete(
        authnService.authenticate,
        authzService.requireRole(adminRole),
        userAccountsController.delete
    );

router.route('/user-accounts/register')
    .post(
        authnService.authenticate,
        authzService.requireRole(adminRole),
        userAccountsController.register
    );

module.exports = router;
