'use strict';

const mitigationsRepository = require('../repository/mitigations-repository');
const BaseService = require('./_base.service');
const { Mitigation: MitigationType } = require('../lib/types');

class MitigationsService extends BaseService {}

module.exports = new MitigationsService(MitigationType, mitigationsRepository);
