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

    async create(data, options) {
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
    
        // Create the document
        const software = new Software(data);
    
        options = options || {};
        if (!options.import) {
            // Set the ATT&CK Spec Version
            software.stix.x_mitre_attack_spec_version = software.stix.x_mitre_attack_spec_version ?? config.app.attackSpecVersion;
    
            // Record the user account that created the object
            if (options.userAccountId) {
                software.workspace.workflow.created_by_user_account = options.userAccountId;
            }
    
            // Set the default marking definitions
            await attackObjectsService.setDefaultMarkingDefinitions(software);
    
            // Get the organization identity
            const organizationIdentityRef = await systemConfigurationService.retrieveOrganizationIdentityRef();
    
            // Check for an existing object
            let existingObject;
            if (software.stix.id) {
                existingObject = await Software.findOne({ 'stix.id': software.stix.id });
            }
    
            if (existingObject) {
                // New version of an existing object
                // Only set the x_mitre_modified_by_ref property
                software.stix.x_mitre_modified_by_ref = organizationIdentityRef;
            }
            else {
                // New object
                // Assign a new STIX id if not already provided
                if (software.stix.type === 'tool') {
                    software.stix.id = software.stix.id || `tool--${uuid.v4()}`;
                }
                else {
                    software.stix.id = software.stix.id || `malware--${uuid.v4()}`;
                }
    
                // Set the created_by_ref and x_mitre_modified_by_ref properties
                software.stix.created_by_ref = organizationIdentityRef;
                software.stix.x_mitre_modified_by_ref = organizationIdentityRef;
            }
        }
    
        // Save the document in the database
        try {
            const savedSoftware = await software.save();
            return savedSoftware;
        }
        catch(err) {
            if (err.name === 'MongoServerError' && err.code === 11000) {
                // 11000 = Duplicate index
               throw new DuplicateIdError;
            }
            else {
                throw err;
            }
        }
    };

}

module.exports = new SoftwareService();