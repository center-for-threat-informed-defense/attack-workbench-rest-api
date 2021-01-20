'use strict';

const express = require('express');
const techniquesController = require('../controllers/techniques-controller');

const router = express.Router();

router.route('/techniques')
    .get(techniquesController.retrieveAll)
    .post(techniquesController.create);

router.route('/techniques/:stixId')
    .get(techniquesController.retrieveById);

router.route('/techniques/:stixId/modified/:modified')
    .get(techniquesController.retrieveVersionById)
    .put(techniquesController.updateFull)
//    .patch(techniquesController.updatePartial)
    .delete(techniquesController.delete);

module.exports = router;
