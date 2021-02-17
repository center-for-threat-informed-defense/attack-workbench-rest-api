'use strict';

const express = require('express');
const identitiesController = require('../controllers/identities-controller');

const router = express.Router();

router.route('/identities')
    .get(identitiesController.retrieveAll)
    .post(identitiesController.create);

router.route('/identities/:stixId')
    .get(identitiesController.retrieveById);

router.route('/identities/:stixId/modified/:modified')
    .get(identitiesController.retrieveVersionById)
    .put(identitiesController.updateFull)
    //    .patch(groupsController.updatePartial)
    .delete(identitiesController.delete);

module.exports = router;
