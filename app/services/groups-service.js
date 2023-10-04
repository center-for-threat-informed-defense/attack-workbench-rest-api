'use strict';

const uuid = require('uuid');
const Group = require('../models/group-model');
const systemConfigurationService = require('./system-configuration-service');
const identitiesService = require('./identities-service');
const attackObjectsService = require('./attack-objects-service');
const config = require('../config/config');
const regexValidator = require('../lib/regex');
const {lastUpdatedByQueryHelper} = require('../lib/request-parameter-helper');

const errors = {
    missingParameter: 'Missing required parameter',
    badlyFormattedParameter: 'Badly formatted parameter',
    duplicateId: 'Duplicate id',
    notFound: 'Document not found',
    invalidQueryStringParameter: 'Invalid query string parameter',
    invalidType: 'Invalid stix.type'
};
exports.errors = errors;

class GroupsService extends BaseService {

    constructor() {
        super(matrixRepository, Group);

    }
}

module.exports = new GroupsService;