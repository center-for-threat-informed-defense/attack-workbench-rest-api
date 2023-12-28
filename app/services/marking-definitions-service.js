'use strict';

const uuid = require('uuid');
const MarkingDefinition = require('../models/marking-definition-model');
const systemConfigurationService = require('./system-configuration-service');
const identitiesService = require('./identities-service');
const config = require('../config/config');
const BaseService = require('./_base.service');
const MarkingDefinitionRepository = require('../repository/marking-definition-repository');
const { MissingParameterError, BadlyFormattedParameterError, DuplicateIdError } = require('../exceptions');

const errors = {
    missingParameter: 'Missing required parameter',
    badlyFormattedParameter: 'Badly formatted parameter',
    duplicateId: 'Duplicate id',
    notFound: 'Document not found',
    invalidQueryStringParameter: 'Invalid query string parameter',
    cannotUpdateStaticObject: ' Cannot update static object'
};
exports.errors = errors;

// NOTE: A marking definition does not support the modified or revoked properties!!

class MarkingDefinitionsService extends BaseService {


    createIsAsync = true;
    async create(data, options) {
    // This function handles two use cases:
    //   1. This is a completely new object. Create a new object and generate the stix.id if not already
    //      provided. Set stix.created_by_ref to the organization identity.
    //   2. stix.id is defined and options.import is set. Create a new object
    //      using the specified stix.id and stix.created_by_ref.
    // TBD: Overwrite existing object when importing??

    // Create the document
    const markingDefinition = new MarkingDefinition(data);

    options = options || {};
    if (!options.import) {
        // Set the ATT&CK Spec Version
        markingDefinition.stix.x_mitre_attack_spec_version = markingDefinition.stix.x_mitre_attack_spec_version ?? config.app.attackSpecVersion;

        // Record the user account that created the object
        if (options.userAccountId) {
            markingDefinition.workspace.workflow.created_by_user_account = options.userAccountId;
        }

        // Get the organization identity
        const organizationIdentityRef = await systemConfigurationService.retrieveOrganizationIdentityRef();

        // Check for an existing object
        let existingObject;
        if (markingDefinition.stix.id) {
            existingObject = await MarkingDefinition.findOne({ 'stix.id': markingDefinition.stix.id });
        }

        if (existingObject) {
            // Cannot create a new version of an existing object
            const error = new Error(errors.badlyFormattedParameter);
            error.parameterName = 'stixId';
            throw error;
        }
        else {
            // New object
            // Assign a new STIX id if not already provided
            markingDefinition.stix.id = markingDefinition.stix.id || `marking-definition--${uuid.v4()}`;

            // Set the created_by_ref property
            markingDefinition.stix.created_by_ref = organizationIdentityRef;
        }
    }

    // Save the document in the database
    try {
        const savedMarkingDefinition = await markingDefinition.save();
        return savedMarkingDefinition;
    }
    catch(err) {
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


    async delete(stixId) {
        if (!stixId) {
            throw new MissingParameterError;
        }

        try {
            const markingDefinition = await MarkingDefinition.findOneAndRemove({ 'stix.id': stixId });
            //Note: markingDefinition is null if not found
            return markingDefinition
        } catch (err) {
            throw err;
        }

    }

}

module.exports = new MarkingDefinitionsService('marking-definition', MarkingDefinitionRepository);
