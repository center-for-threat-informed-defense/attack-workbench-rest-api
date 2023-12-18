'use strict';

const uuid = require('uuid');
const Software = require('../models/software-model');
const systemConfigurationService = require('./system-configuration-service');
const attackObjectsService = require('./attack-objects-service');
const config = require('../config/config');

const { PropertyNotAllowedError, DuplicateIdError } = require('../exceptions');

const BaseService = require('./_base.service');
const SoftwareRepository = require('../repository/software-repository');

class SoftwareService extends BaseService {

    static async create(data, options) {
        // This function handles two use cases:
        //   1. This is a completely new object. Create a new object and generate the stix.id if not already
        //      provided. Set both stix.created_by_ref and stix.x_mitre_modified_by_ref to the organization identity.
        //   2. This is a new version of an existing object. Create a new object with the specified id.
        //      Set stix.x_mitre_modified_by_ref to the organization identity.
    
        // is_family defaults to true for malware, not allowed for tools
        if (data.stix && data.stix.type === 'malware' && typeof data.stix.is_family !== 'boolean') {
            data.stix.is_family = true;
        }
        else if (data.stix && data.stix.type === 'tool' && data.stix.is_family !== undefined) {
            throw new PropertyNotAllowedError;
        }
        
        super.create(data, options);

    }

}

module.exports = new SoftwareService(null, SoftwareRepository);