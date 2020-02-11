'use strict';

const express = require('express');
const techniqueController = require('../controllers/technique-controller');

const router = express.Router();

router.route('/techniques')
    .get(techniqueController.retrieveAll)
    .post(techniqueController.create);

router.route('/techniques/:stixId')
    .get(techniqueController.retrieveById)
//    .put(techniqueController.updateFull)
//    .patch(techniqueController.updatePartial)
//    .delete(techniqueController.delete);

module.exports = router;
