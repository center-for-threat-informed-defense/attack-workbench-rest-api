'use strict';

const express = require('express');
const tacticsController = require('../controllers/tactics-controller');

const router = express.Router();

router.route('/tactics')
    .get(tacticsController.retrieveAll)
    .post(tacticsController.create);

router.route('/tactics/:stixId')
    .get(tacticsController.retrieveById);

router.route('/tactics/:stixId/modified/:modified')
    .get(tacticsController.retrieveVersionById)
    .put(tacticsController.updateFull)
//    .patch(tacticsController.updatePartial)
    .delete(tacticsController.delete);

module.exports = router;
