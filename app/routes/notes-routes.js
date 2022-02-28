'use strict';

const express = require('express');
const notesController = require('../controllers/notes-controller');

const router = express.Router();

router.route('/notes')
    .get(
        notesController.retrieveAll
    )
    .post(
        notesController.create
    );

router.route('/notes/:stixId')
    .get(notesController.retrieveById)
    .delete(notesController.delete);

router.route('/notes/:stixId/modified/:modified')
    .get(notesController.retrieveVersionById)
    .put(notesController.updateVersion)
    //    .patch(notesController.updatePartial)
    .delete(notesController.deleteVersion);

module.exports = router;
