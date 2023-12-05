const BaseRepository = require('./_base.repository');

const Note = require('../models/note-model');

class NotesRepository extends BaseRepository { }

module.exports = new NotesRepository(Note);