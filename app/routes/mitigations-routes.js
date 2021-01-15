'use strict';

const express = require('express');
const mitigationsController = require('../controllers/mitigations-controller');

const router = express.Router();

router.route('/mitigations')
    .get(mitigationsController.retrieveAll)
    .post(mitigationsController.create);

router.route('/mitigations/:stixId')
    .get(mitigationsController.retrieveById);

router.route('/mitigations/:stixId/modified/:modified')
    .get(mitigationsController.retrieveVersionById)
    .put(mitigationsController.updateFull)
//    .patch(mitigationsController.updatePartial)
    .delete(mitigationsController.delete);

module.exports = router;
