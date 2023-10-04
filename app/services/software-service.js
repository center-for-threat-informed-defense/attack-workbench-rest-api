'use strict';

const uuid = require('uuid');
const Software = require('../models/software-model');
const systemConfigurationService = require('./system-configuration-service');
const identitiesService = require('./identities-service');
const attackObjectsService = require('./attack-objects-service');
const config = require('../config/config');
const regexValidator = require('../lib/regex');
const {lastUpdatedByQueryHelper} = require('../lib/request-parameter-helper');

const { MissingParameterError, MissingPropertyError, PropertyNotAllowedError, BadlyFormattedParameterError, DuplicateIdError, NotFoundError, InvalidQueryStringParameterError } = require('../exceptions');

const BaseService = require('./_base.service');
const SoftwareRepository = require('../repository/software-repository');

class SoftwareService extends BaseService {
    constructor () {
        super(SoftwareRepository, Software);
    }

}

module.exports = new SoftwareService();