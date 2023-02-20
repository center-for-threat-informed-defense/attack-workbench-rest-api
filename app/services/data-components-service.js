'use strict';

const uuid = require('uuid');
const DataComponent = require('../models/data-component-model');
const systemConfigurationService = require('./system-configuration-service');
const attackObjectsService = require('./attack-objects-service');
const config = require('../config/config');
const identitiesService = require('./identities-service');

exports.errors = attackObjectsService.errors;

exports.retrieveAll = attackObjectsService.makeRetrieveAllSync(
    DataComponent,
    addExtraDataToAll
);
exports.retrieveAllAsync = attackObjectsService.makeRetrieveAllAsync(
    DataComponent,
    addExtraDataToAll
);
exports.retrieveById = attackObjectsService.makeRetrieveByIdSync(
    DataComponent,
    addExtraData,
    addExtraDataToAll
);
exports.retrieveVersionById = attackObjectsService.makeRetrieveVersionByIdSync(
    DataComponent,
    addExtraData
);

async function addExtraData(dataSource, options) {
    await identitiesService.addCreatedByAndModifiedByIdentities(dataSource);
}

async function addExtraDataToAll(dataSources, options) {
    await identitiesService.addCreatedByAndModifiedByIdentitiesToAll(dataSources);
}

exports.createIsAsync = true;
exports.create = async function (data, options) {
    // This function handles two use cases:
    //   1. This is a completely new object. Create a new object and generate the stix.id if not already
    //      provided. Set both stix.created_by_ref and stix.x_mitre_modified_by_ref to the organization identity.
    //   2. This is a new version of an existing object. Create a new object with the specified id.
    //      Set stix.x_mitre_modified_by_ref to the organization identity.

    // Create the document
    const dataComponent = new DataComponent(data);

    options = options || {};
    if (!options.import) {
        // Set the ATT&CK Spec Version
        dataComponent.stix.x_mitre_attack_spec_version = dataComponent.stix.x_mitre_attack_spec_version ?? config.app.attackSpecVersion;

        // Record the user account that created the object
        if (options.userAccountId) {
            dataComponent.workspace.workflow.created_by_user_account = options.userAccountId;
        }

        // Set the default marking definitions
        await attackObjectsService.setDefaultMarkingDefinitions(dataComponent);

        // Get the organization identity
        const organizationIdentityRef = await systemConfigurationService.retrieveOrganizationIdentityRef();

        // Check for an existing object
        let existingObject;
        if (dataComponent.stix.id) {
            existingObject = await DataComponent.findOne({ 'stix.id': dataComponent.stix.id });
        }

        if (existingObject) {
            // New version of an existing object
            // Only set the x_mitre_modified_by_ref property
            dataComponent.stix.x_mitre_modified_by_ref = organizationIdentityRef;
        }
        else {
            // New object
            // Assign a new STIX id if not already provided
            dataComponent.stix.id = dataComponent.stix.id || `x-mitre-data-component--${uuid.v4()}`;

            // Set the created_by_ref and x_mitre_modified_by_ref properties
            dataComponent.stix.created_by_ref = organizationIdentityRef;
            dataComponent.stix.x_mitre_modified_by_ref = organizationIdentityRef;
        }
    }

    // Save the document in the database
    try {
        const savedDataComponent = await dataComponent.save();
        return savedDataComponent;
    }
    catch (err) {
        if (err.name === 'MongoServerError' && err.code === 11000) {
            // 11000 = Duplicate index
            const error = new Error(attackObjectsService.errors.duplicateId);
            throw error;
        }
        else {
            throw err;
        }
    }
};

exports.updateFull = function (stixId, stixModified, data, callback) {
    if (!stixId) {
        const error = new Error(attackObjectsService.errors.missingParameter);
        error.parameterName = 'stixId';
        return callback(error);
    }

    if (!stixModified) {
        const error = new Error(attackObjectsService.errors.missingParameter);
        error.parameterName = 'modified';
        return callback(error);
    }

    DataComponent.findOne({ 'stix.id': stixId, 'stix.modified': stixModified }, function (err, document) {
        if (err) {
            if (err.name === 'CastError') {
                var error = new Error(attackObjectsService.errors.badlyFormattedParameter);
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
                        var error = new Error(attackObjectsService.errors.duplicateId);
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

exports.deleteById = attackObjectsService.makeDeleteByIdSync(DataComponent);
exports.deleteVersionById = attackObjectsService.makeDeleteVersionByIdSync(DataComponent);
