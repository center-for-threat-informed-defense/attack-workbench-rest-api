'use strict';

const BaseRepository = require('./_base.repository');
const Note = require('../models/note-model');

class NoteRepository extends BaseRepository {

    constructor() {
        super(Note);
    }
}

module.exports = new NoteRepository();