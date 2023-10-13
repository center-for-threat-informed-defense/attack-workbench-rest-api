'use strict';


const Mitigation = require('../models/mitigation-model');

const mitigationsRepository = require('../repository/mitigations-repository');

const BaseService = require('./_base.service');

class MitigationsService extends BaseService {

    constructor() {
        super(mitigationsRepository, Mitigation);
    }
}

module.exports = new MitigationsService();