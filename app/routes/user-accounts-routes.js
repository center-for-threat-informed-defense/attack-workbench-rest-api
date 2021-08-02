'use strict';

const express = require('express');
const userAccountsController = require('../controllers/user-accounts-controller');

const router = express.Router();

router.route('/user-accounts')
    .get(userAccountsController.retrieveAll)
    .post(userAccountsController.create);

router.route('/user-accounts/:id')
    .get(userAccountsController.retrieveById)
    .put(userAccountsController.updateFull)
    .delete(userAccountsController.delete);

module.exports = router;
