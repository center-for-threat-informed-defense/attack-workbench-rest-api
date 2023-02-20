'use strict';

const uuid = require('uuid');
const DataSource = require('../models/data-source-model');
const systemConfigurationService = require('./system-configuration-service');
const identitiesService = require('./identities-service');
const dataComponentsService = require('./data-components-service');
const attackObjectsService = require('./attack-objects-service');
const config = require('../config/config');

exports.errors = attackObjectsService.errors;

exports.retrieveAll = attackObjectsService.makeRetrieveAllSync(
    DataSource,
    addExtraDataToAll
);
exports.retrieveById = attackObjectsService.makeRetrieveByIdSync(
    DataSource,
    addExtraData,
    addExtraDataToAll
);
exports.retrieveVersionById = attackObjectsService.makeRetrieveVersionByIdSync(
    DataSource,
    addExtraData
);

async function addExtraData(dataSource, options) {
    await identitiesService.addCreatedByAndModifiedByIdentities(dataSource);
    if (options?.retrieveDataComponents) {
        await addDataComponents(dataSource);
    }
}

async function addExtraDataToAll(dataSources, options) {
    for (const dataSource of dataSources) {
        // eslint-disable-next-line no-await-in-loop
        await addExtraData(dataSource, options);
    }
}

async function addDataComponents(dataSource) {
    // We have to work with the latest version of all data components to avoid mishandling a situation
    // where an earlier version of a data component may reference a data source, but the latest
    // version doesn't.

    // Retrieve the latest version of all data components
    const allDataComponents = await dataComponentsService.retrieveAllAsync({});

    // Add the data components that reference the data source
    dataSource.dataComponents = allDataComponents.filter(dataComponent => dataComponent.stix.x_mitre_data_source_ref === dataSource.stix.id);
}

exports.createIsAsync = true;
exports.create = async function (data, options) {
    // This function handles two use cases:
    //   1. This is a completely new object. Create a new object and generate the stix.id if not already
    //      provided. Set both stix.created_by_ref and stix.x_mitre_modified_by_ref to the organization identity.
    //   2. This is a new version of an existing object. Create a new object with the specified id.
    //      Set stix.x_mitre_modified_by_ref to the organization identity.

    // Create the document
    const dataSource = new DataSource(data);

    options = options || {};
    if (!options.import) {
        // Set the ATT&CK Spec Version
        dataSource.stix.x_mitre_attack_spec_version = dataSource.stix.x_mitre_attack_spec_version ?? config.app.attackSpecVersion;

        // Record the user account that created the object
        if (options.userAccountId) {
            dataSource.workspace.workflow.created_by_user_account = options.userAccountId;
        }

        // Set the default marking definitions
        await attackObjectsService.setDefaultMarkingDefinitions(dataSource);

        // Get the organization identity
        const organizationIdentityRef = await systemConfigurationService.retrieveOrganizationIdentityRef();

        // Check for an existing object
        let existingObject;
        if (dataSource.stix.id) {
            existingObject = await DataSource.findOne({ 'stix.id': dataSource.stix.id });
        }

        if (existingObject) {
            // New version of an existing object
            // Only set the x_mitre_modified_by_ref property
            dataSource.stix.x_mitre_modified_by_ref = organizationIdentityRef;
        }
        else {
            // New object
            // Assign a new STIX id if not already provided
            dataSource.stix.id = dataSource.stix.id || `x-mitre-data-source--${uuid.v4()}`;

            // Set the created_by_ref and x_mitre_modified_by_ref properties
            dataSource.stix.created_by_ref = organizationIdentityRef;
            dataSource.stix.x_mitre_modified_by_ref = organizationIdentityRef;
        }
    }

    // Save the document in the database
    try {
        const savedDataSource = await dataSource.save();
        return savedDataSource;
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

    DataSource.findOne({ 'stix.id': stixId, 'stix.modified': stixModified }, function (err, document) {
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

exports.deleteById = attackObjectsService.makeDeleteByIdSync(DataSource);
exports.deleteVersionById = attackObjectsService.makeDeleteVersionByIdSync(DataSource);
