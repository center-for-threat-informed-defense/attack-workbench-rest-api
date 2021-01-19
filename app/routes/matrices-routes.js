'use strict';

const express = require('express');
const matricesController = require('../controllers/matrices-controller');

const router = express.Router();

router.route('/matrices')
    .get(matricesController.retrieveAll)
    .post(matricesController.create);

router.route('/matrices/:stixId')
    .get(matricesController.retrieveById);

router.route('/matrices/:stixId/modified/:modified')
    .get(matricesController.retrieveVersionById)
    .put(matricesController.updateFull)
    //    .patch(matricesController.updatePartial)
    .delete(matricesController.delete);

module.exports = router;
