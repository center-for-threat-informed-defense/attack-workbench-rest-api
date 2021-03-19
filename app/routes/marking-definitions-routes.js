'use strict';

const express = require('express');
const markingDefinitionsController = require('../controllers/marking-definitions-controller');

const router = express.Router();

router.route('/marking-definitions')
    .get(markingDefinitionsController.retrieveAll)
    .post(markingDefinitionsController.create);

router.route('/marking-definitions/:stixId')
    .get(markingDefinitionsController.retrieveById)
    .put(markingDefinitionsController.updateFull)
    //    .patch(groupsController.updatePartial)
    .delete(markingDefinitionsController.delete);

module.exports = router;
