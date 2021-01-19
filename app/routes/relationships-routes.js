'use strict';

const express = require('express');
const relationshipsController = require('../controllers/relationships-controller');

const router = express.Router();

router.route('/relationships')
    .get(relationshipsController.retrieveAll)
    .post(relationshipsController.create);

router.route('/relationships/:stixId')
    .get(relationshipsController.retrieveById);

router.route('/relationships/:stixId/modified/:modified')
    .get(relationshipsController.retrieveVersionById)
    .put(relationshipsController.updateFull)
    //    .patch(relationshipsController.updatePartial)
    .delete(relationshipsController.delete);

module.exports = router;
