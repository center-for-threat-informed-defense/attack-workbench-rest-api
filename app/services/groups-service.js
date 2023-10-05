'use strict';

const uuid = require('uuid');
const Group = require('../models/group-model');
const systemConfigurationService = require('./system-configuration-service');
const identitiesService = require('./identities-service');
const attackObjectsService = require('./attack-objects-service');
const config = require('../config/config');
const regexValidator = require('../lib/regex');
const {lastUpdatedByQueryHelper} = require('../lib/request-parameter-helper');

const { DuplicateIdError, BadlyFormattedParameterError, InvalidTypeError, InvalidQueryStringParameterError } = require('../exceptions');

const BaseService = require('./_base.service');
const groupsRepository = require('../repository/groups-repository');

class GroupsService extends BaseService {

    constructor() {
        super(groupsRepository, Group);

    }
}

module.exports = new GroupsService;