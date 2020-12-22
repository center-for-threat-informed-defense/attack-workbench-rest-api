'use strict';

const express = require('express');
const groupsController = require('../controllers/groups-controller');

const router = express.Router();

router.route('/groups')
    .get(groupsController.retrieveAll)
    .post(groupsController.create);

router.route('/groups/:stixId')
    .get(groupsController.retrieveById);

router.route('/groups/:stixId/modified/:modified')
    .get(groupsController.retrieveVersionById)
    .put(groupsController.updateFull)
//    .patch(groupsController.updatePartial)
    .delete(groupsController.delete);

module.exports = router;
