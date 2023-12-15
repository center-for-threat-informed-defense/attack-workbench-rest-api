'use strict';

const BaseRepository = require('./_base.repository');
const Tactic = require('../models/tactic-model');

class TacticsRepository extends BaseRepository {

    constructor() {
        super(Tactic);
    }
}

module.exports = new TacticsRepository();
