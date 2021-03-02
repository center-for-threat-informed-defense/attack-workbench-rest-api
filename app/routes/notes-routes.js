'use strict';

const express = require('express');
const notesController = require('../controllers/notes-controller');

const router = express.Router();

router.route('/notes')
    .get(notesController.retrieveAll)
    .post(notesController.create);

router.route('/notes/:stixId')
    .get(notesController.retrieveById);

router.route('/notes/:stixId/modified/:modified')
    .get(notesController.retrieveVersionById)
    .put(notesController.updateFull)
    //    .patch(notesController.updatePartial)
    .delete(notesController.delete);

module.exports = router;
