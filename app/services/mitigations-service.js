'use strict';

const mitigationsRepository = require('../repository/mitigations-repository');

const BaseService = require('./_base.service');

class MitigationsService extends BaseService { }

module.exports = new MitigationsService('course-of-action', mitigationsRepository);