'use strict';

const logSourcesRepository = require('../repository/log-sources-repository');
const BaseService = require('./_base.service');
const { LogSource: LogSourceType } = require('../lib/types');

class LogSourcesService extends BaseService {}

module.exports = new LogSourcesService(LogSourceType, logSourcesRepository);
