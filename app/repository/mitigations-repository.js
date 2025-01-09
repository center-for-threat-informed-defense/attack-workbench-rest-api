'use strict';

const BaseRepository = require('./_base.repository');
const Mitigation = require('../models/mitigation-model');

class MitigationsRepository extends BaseRepository {}

module.exports = new MitigationsRepository(Mitigation);
