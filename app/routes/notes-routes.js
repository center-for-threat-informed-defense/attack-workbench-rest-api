'use strict';

const express = require('express');
const notesController = require('../controllers/notes-controller');

const router = express.Router();

router.route('/notes')
    .get(notesController.retrieveAll)
    .post(notesController.create);

router.route('/notes/:stixId')
    .get(notesController.retrieve)
    .delete(notesController.delete);

router.route('/notes/:stixId/modified/:modified')
    .get(notesController.retrieveVersion)
    .put(notesController.updateVersion)
    //    .patch(notesController.updatePartial)
    .delete(notesController.deleteVersion);

module.exports = router;
