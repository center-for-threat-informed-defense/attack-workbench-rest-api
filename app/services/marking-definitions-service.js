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
    cannotUpdateStaticObject: 'Cannot update static object'
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
            existingObject = await this.repository.model.findOne({ 'stix.id': markingDefinition.stix.id });
        }

        if (existingObject) {
            // Cannot create a new version of an existing object
            throw new BadlyFormattedParameterError;
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
            throw new DuplicateIdError;
        }
        else {
            throw err;
        }
    }
};


    async updateFull(stixId, data, callback) {

        if (data?.workspace?.workflow?.state === 'static') {
            if (callback) {
                return callback(new Error(errors.cannotUpdateStaticObject));
            }

            throw new Error(errors.cannotUpdateStaticObject);
        }

        const newDoc = await super.updateFull(stixId, data, callback);

        return newDoc;
};

    async retrieveById(stixId, options, callback) {
        try {
            if (!stixId) {
                throw new MissingParameterError;
            }

            const markingDefinition = await this.repository.model.findOne({ 'stix.id': stixId }).lean().exec();

            // Note: document is null if not found
            if (markingDefinition) {
                await identitiesService.addCreatedByAndModifiedByIdentities(markingDefinition);
                if (callback) {
                    return callback(null, [markingDefinition]);
                }
                return [markingDefinition];
            } else {
                if (callback) {
                    return callback(null, []);
                }
                return [];
            }
        } catch (err) {
            if (callback) {
                return callback(err);
            }
            if (err.name === 'CastError') {
                throw new BadlyFormattedParameterError;
            } else {
                throw err;
            }
        }
}



    async delete(stixId) {
        if (!stixId) {
            throw new MissingParameterError;
        }

        try {
            const markingDefinition = await MarkingDefinition.findOneAndRemove({ 'stix.id': stixId });
            //Note: markingDefinition is null if not found
            return markingDefinition;
        } catch (err) {
            throw err;
        }

    }

}

module.exports = new MarkingDefinitionsService('marking-definition', MarkingDefinitionRepository);
