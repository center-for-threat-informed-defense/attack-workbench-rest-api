'use strict';

const BaseRepository = require('./_base.repository');
const Reference = require('../models/reference-model');

class ReferencesRepository extends BaseRepository { }

module.exports = new ReferencesRepository(Reference);