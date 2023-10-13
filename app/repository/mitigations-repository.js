'use strict';

const BaseRepository = require('./_base.repository');
const Mitigation = require('../models/mitigation-model');

class MitigationsRepository extends BaseRepository {

    constructor() {
        super(Mitigation);
    }
}

module.exports = new MitigationsRepository();