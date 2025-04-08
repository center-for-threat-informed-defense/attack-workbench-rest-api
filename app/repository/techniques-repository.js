'use strict';

const BaseRepository = require('./_base.repository');
const Technique = require('../models/technique-model');

class TechniqueRepository extends BaseRepository {}

module.exports = new TechniqueRepository(Technique);
