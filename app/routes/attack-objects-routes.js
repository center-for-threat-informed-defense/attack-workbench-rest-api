'use strict';

const express = require('express');

const attackObjectsController = require('../controllers/attack-objects-controller');
const authn = require('../lib/authn-middleware');
const authz = require('../lib/authz-middleware');

const router = express.Router();

router.route('/attack-objects')
    .get(
        authn.authenticate,
        authz.requireRole(authz.visitorOrHigher, authz.readOnlyService),
        attackObjectsController.retrieveAll
    );

// router.route('/attack-objects/users')
//     .get(
//         authn.authenticate,
//         authz.requireRole(authz.visitorOrHigher, authz.readOnlyService),  //Proper access controls? Or shoudl be user required role?
//         attackObjectsController.retrieveAll
//     );

module.exports = router;
