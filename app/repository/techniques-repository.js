'use strict';

const BaseRepository = require('./_base.repository');
const Technique = require('../models/technique-model');

class TechniqueRepository extends BaseRepository {

    constructor() {
        super(Technique);
    }
}

module.exports = new TechniqueRepository();