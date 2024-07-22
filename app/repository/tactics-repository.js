'use strict';

const BaseRepository = require('./_base.repository');
const Tactic = require('../models/tactic-model');

class TacticsRepository extends BaseRepository { }

module.exports = new TacticsRepository(Tactic);
