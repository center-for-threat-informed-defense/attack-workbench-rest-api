'use strict';

const express = require('express');
const softwareController = require('../controllers/software-controller');

const router = express.Router();

router.route('/software')
    .get(softwareController.retrieveAll)
    .post(softwareController.create);

router.route('/software/:stixId')
    .get(softwareController.retrieveById);

router.route('/software/:stixId/modified/:modified')
    .get(softwareController.retrieveVersionById)
    .put(softwareController.updateFull)
//    .patch(softwareController.updatePartial)
    .delete(softwareController.delete);

module.exports = router;
