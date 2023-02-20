'use strict';

const uuid = require('uuid');
const Group = require('../models/group-model');
const systemConfigurationService = require('./system-configuration-service');
const attackObjectsService = require('./attack-objects-service');
const config = require('../config/config');
const identitiesService = require('./identities-service');

const errors = {
    missingParameter: 'Missing required parameter',
    badlyFormattedParameter: 'Badly formatted parameter',
    duplicateId: 'Duplicate id',
    notFound: 'Document not found',
    invalidQueryStringParameter: 'Invalid query string parameter',
    invalidType: 'Invalid stix.type'
};
exports.errors = errors;

exports.retrieveAll = attackObjectsService.makeRetrieveAllSync(
    Group,
    addExtraDataToAll
);
exports.retrieveById = attackObjectsService.makeRetrieveByIdSync(
    Group,
    addExtraData,
    addExtraDataToAll
);
exports.retrieveVersionById = attackObjectsService.makeRetrieveVersionByIdSync(
    Group,
    addExtraData
);

async function addExtraData(group, options) {
    await identitiesService.addCreatedByAndModifiedByIdentities(group);
}

async function addExtraDataToAll(groups, options) {
    await identitiesService.addCreatedByAndModifiedByIdentitiesToAll(groups);
}

exports.createIsAsync = true;
exports.create = async function (data, options) {
    // This function handles two use cases:
    //   1. This is a completely new object. Create a new object and generate the stix.id if not already
    //      provided. Set both stix.created_by_ref and stix.x_mitre_modified_by_ref to the organization identity.
    //   2. This is a new version of an existing object. Create a new object with the specified id.
    //      Set stix.x_mitre_modified_by_ref to the organization identity.

    if (data.stix.type !== 'intrusion-set') {
        throw new Error(errors.invalidType);
    }

    // Create the document
    const group = new Group(data);

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
            existingObject = await Group.findOne({ 'stix.id': group.stix.id });
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
            // 11000 = Duplicate index
            const error = new Error(errors.duplicateId);
            throw error;
        }
        else {
            throw err;
        }
    }
};

exports.updateFull = function (stixId, stixModified, data, callback) {
    if (!stixId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'stixId';
        return callback(error);
    }

    if (!stixModified) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'modified';
        return callback(error);
    }

    Group.findOne({ 'stix.id': stixId, 'stix.modified': stixModified }, function (err, document) {
        if (err) {
            if (err.name === 'CastError') {
                var error = new Error(errors.badlyFormattedParameter);
                error.parameterName = 'stixId';
                return callback(error);
            }
            else {
                return callback(err);
            }
        }
        else if (!document) {
            // document not found
            return callback(null);
        }
        else {
            // Copy data to found document and save
            Object.assign(document, data);
            document.save(function (err, savedDocument) {
                if (err) {
                    if (err.name === 'MongoServerError' && err.code === 11000) {
                        // 11000 = Duplicate index
                        var error = new Error(errors.duplicateId);
                        return callback(error);
                    }
                    else {
                        return callback(err);
                    }
                }
                else {
                    return callback(null, savedDocument);
                }
            });
        }
    });
};

exports.deleteById = attackObjectsService.makeDeleteByIdSync(Group);
exports.deleteVersionById = attackObjectsService.makeDeleteVersionByIdSync(Group);
