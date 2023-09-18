'use strict';

const uuid = require('uuid');
const util = require('util');
const Matrix = require('../models/matrix-model');
const systemConfigurationService = require('./system-configuration-service');
const identitiesService = require('./identities-service');
const attackObjectsService = require('./attack-objects-service');
const config = require('../config/config');
const matrixRepository = require('../repository/matrix-repository');
const logger = require('../lib/logger');
const { paginate } = require('../lib/pagination');
const { DatabaseError,
    GenericServiceError,
    IdentityServiceError,
    MissingParameterError,
    InvalidQueryStringParameterError } = require('../exceptions');
const AbstractService = require('./_service.abstract');
const { getStixIdPrefixFromModel } = require('../lib/attack-prefix-ids');

// Set prototype to AbstractService to help ensure that all required functions are implemented
Object.setPrototypeOf(this, AbstractService);

exports.retrieveAll = async function (repository, options) {
    let results;
    try {
        results = await repository.retrieveAll(options);
    } catch (err) {
        logger.error('Failed to retrieve records from the repository');
        throw new DatabaseError(err); // Let the DatabaseError bubble up
    }

    try {
        await identitiesService.addCreatedByAndModifiedByIdentitiesToAll(results[0].documents);
    } catch (err) {
        logger.error('Failed to add identities to documents.');
        throw new IdentityServiceError({
            details: err.message,
            cause: err
        });
    }

    return paginate(options, results);
};

exports.retrieveById = async function (repository, stixId, options) {
    if (!stixId) {
        throw new MissingParameterError({ parameterName: 'stixId' });
    }

    try {
        if (options.versions === 'all') {
            const documents = await repository.retrieveAllById(stixId);

            try {
                await identitiesService.addCreatedByAndModifiedByIdentitiesToAll(documents);
            } catch (err) {
                logger.error('Failed to add identities to all documents.');
                throw new IdentityServiceError({
                    details: err.message,
                    cause: err
                });
            }

            return documents;

        } else if (options.versions === 'latest') {
            const document = await repository.retrieveLatestByStixId(stixId);

            if (document) {
                try {
                    await identitiesService.addCreatedByAndModifiedByIdentities(document);
                } catch (err) {
                    logger.error('Failed to add identities to the latest document.');
                    throw new IdentityServiceError({
                        details: err.message,
                        cause: err
                    });
                }

                return [document];
            } else {
                return [];
            }

        } else {
            throw new InvalidQueryStringParameterError({ parameterName: 'versions' });
        }
    } catch (err) {
        logger.error('Failed during document retrieval by ID.');
        throw err; // Let the DatabaseError bubble up
    }
};

exports.retrieveVersionById = async function (repository, stixId, modified) {
    if (!stixId) {
        throw new MissingParameterError({ parameterName: 'stixId' });
    }

    if (!modified) {
        throw new MissingParameterError({ parameterName: 'modified' });
    }

    try {
        const document = await repository.retrieveOneByVersion(stixId, modified);

        if (!document) {
            console.log('** NOT FOUND');
            // TODO determine if we should throw an error here instead of returning null
            // throw new NotFoundError({ ... });
            return null;
        } else {
            try {
                await identitiesService.addCreatedByAndModifiedByIdentities(document);
            } catch (err) {
                logger.error('Failed to add identities to the document.');
                throw new IdentityServiceError({
                    details: err.message,
                    cause: err
                });
            }
            return document;
        }
    } catch (err) {
        logger.error('Failed during document retrieval by version and ID.');
        throw err; // Let the DatabaseError bubble up
    }
};

exports.createIsAsync = true;
exports.create = async function (repository, model, data, options) {
    try {
        // This function handles two use cases:
        //   1. This is a completely new object. Create a new object and generate the stix.id if not already
        //      provided. Set both stix.created_by_ref and stix.x_mitre_modified_by_ref to the organization identity.
        //   2. This is a new version of an existing object. Create a new object with the specified id.
        //      Set stix.x_mitre_modified_by_ref to the organization identity.

        // Create the document
        const document = new model(data);

        options = options || {};
        if (!options.import) {
            // Set the ATT&CK Spec Version
            document.stix.x_mitre_attack_spec_version = document.stix.x_mitre_attack_spec_version ?? config.app.attackSpecVersion;

            // Record the user account that created the object
            if (options.userAccountId) {
                document.workspace.workflow.created_by_user_account = options.userAccountId;
            }

            // Set the default marking definitions
            await attackObjectsService.setDefaultMarkingDefinitions(document);

            // Get the organization identity
            const organizationIdentityRef = await systemConfigurationService.retrieveOrganizationIdentityRef();

            // Check for an existing object
            let existingObject;
            if (document.stix.id) {
                existingObject = await repository.retrieveAllById(document.stix.id);
            }

            if (existingObject) {
                // New version of an existing object
                // Only set the x_mitre_modified_by_ref property
                document.stix.x_mitre_modified_by_ref = organizationIdentityRef;
            }
            else {
                // New object
                // Assign a new STIX id if not already provided
                if (!document.stix.id) {
                    const stixIdPrefix = getStixIdPrefixFromModel(model.name, document.stix.type);
                    document.stix.id = `${stixIdPrefix}--${uuid.v4()}`;
                }

                // Set the created_by_ref and x_mitre_modified_by_ref properties
                document.stix.created_by_ref = organizationIdentityRef;
                document.stix.x_mitre_modified_by_ref = organizationIdentityRef;
            }
        }
        return await repository.save(document);
    } catch (err) {
        logger.error(err);
        throw err;
    }
};