'use strict';


const Mitigation = require('../models/mitigation-model');
const {lastUpdatedByQueryHelper} = require('../lib/request-parameter-helper');

const errors = {
    missingParameter: 'Missing required parameter',
    badlyFormattedParameter: 'Badly formatted parameter',
    duplicateId: 'Duplicate id',
    notFound: 'Document not found',
    invalidQueryStringParameter: 'Invalid query string parameter'
};
exports.errors = errors;

const mitigationsRepository = require('../repository/mitigations-repository');

const BaseService = require('./_base.service');

class MitigationsService extends BaseService {

    constructor() {
        super(mitigationsRepository, Mitigation);
    }
}

module.exports = new MitigationsService();