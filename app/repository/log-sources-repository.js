'use strict';

const BaseRepository = require('./_base.repository');
const LogSource = require('../models/log-source-model');

class LogSourcesRepository extends BaseRepository {}

module.exports = new LogSourcesRepository(LogSource);
