'use strict';

const uuid = require('uuid');
const Software = require('../models/software-model');
const systemConfigurationService = require('./system-configuration-service');
const identitiesService = require('./identities-service');
const attackObjectsService = require('./attack-objects-service');
const config = require('../config/config');
const regexValidator = require('../lib/regex');
const {lastUpdatedByQueryHelper} = require('../lib/request-parameter-helper');

const errors = {
    missingParameter: 'Missing required parameter',
    missingProperty: 'Missing required property',
    propertyNotAllowed: 'Includes property that is not allowed',
    badlyFormattedParameter: 'Badly formatted parameter',
    duplicateId: 'Duplicate id',
    notFound: 'Document not found',
    invalidQueryStringParameter: 'Invalid query string parameter'
};
exports.errors = errors;

const BaseService = require('./_base.service');
const SoftwareRepository = require('../repository/software-repository');

class SoftwareService extends BaseService {
    constructor () {
        super(SoftwareRepository, Software);
    }

}

module.exports = new SoftwareService();