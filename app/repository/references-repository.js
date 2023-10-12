'use strict';

const BaseRepository = require('./_base.repository');
const Reference = require('../models/reference-model');

class ReferenceRepository extends BaseRepository {

    constructor() {
        super(Reference);
    }
}

module.exports = new ReferenceRepository();