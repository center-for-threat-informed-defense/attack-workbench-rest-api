'use strict';

const uuid = require('uuid');
const Group = require('../models/group-model');
const systemConfigurationService = require('./system-configuration-service');
const attackObjectsService = require('./attack-objects-service');
const config = require('../config/config');

const { DuplicateIdError, InvalidTypeError} = require('../exceptions');

const BaseService = require('./_base.service');
const groupsRepository = require('../repository/groups-repository');

class GroupsService extends BaseService {

    constructor() {
        super(groupsRepository, Group);

    }

    async create(data, options) {

        // This function handles two use cases:
        //   1. This is a completely new object. Create a new object and generate the stix.id if not already
        //      provided. Set both stix.created_by_ref and stix.x_mitre_modified_by_ref to the organization identity.
        //   2. This is a new version of an existing object. Create a new object with the specified id.
        //      Set stix.x_mitre_modified_by_ref to the organization identity.
    
        if (data.stix.type !== 'intrusion-set') {
            throw new InvalidTypeError;
        }
    
        // Create the document
        const group = new this.model(data);
    
        options = options || {};
        if (!options.import) {
            // Set the ATT&CK Spec Version
            group.stix.x_mitre_attack_spec_version = group.stix.x_mitre_attack_spec_version ?? config.app.attackSpecVersion;
    
            // Record the user account that created the object
            if (options.userAccountId) {
                group.workspace.workflow.created_by_user_account = options.userAccountId;
            }
    
            // Set the default marking definitions
            await attackObjectsService.setDefaultMarkingDefinitions(group);
    
            // Get the organization identity
            const organizationIdentityRef = await systemConfigurationService.retrieveOrganizationIdentityRef();
    
            // Check for an existing object
            let existingObject;
            if (group.stix.id) {
                existingObject = await this.model.findOne({ 'stix.id': group.stix.id });
            }
    
            if (existingObject) {
                // New version of an existing object
                // Only set the x_mitre_modified_by_ref property
                group.stix.x_mitre_modified_by_ref = organizationIdentityRef;
            }
            else {
                // New object
                // Assign a new STIX id if not already provided
                group.stix.id = group.stix.id || `intrusion-set--${uuid.v4()}`;
    
                // Set the created_by_ref and x_mitre_modified_by_ref properties
                group.stix.created_by_ref = organizationIdentityRef;
                group.stix.x_mitre_modified_by_ref = organizationIdentityRef;
            }
        }
    
        // Save the document in the database
        try {
            const savedGroup = await group.save();
            return savedGroup;
        }
        catch (err) {
            if (err.name === 'MongoServerError' && err.code === 11000) {
                throw new DuplicateIdError;
            }
            else {
                throw err;
            }
        }
    }
}

module.exports = new GroupsService;