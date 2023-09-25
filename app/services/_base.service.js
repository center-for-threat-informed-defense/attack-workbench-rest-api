'use strict';

const uuid = require('uuid');
const systemConfigurationService = require('./system-configuration-service');
const identitiesService = require('./identities-service');
const attackObjectsService = require('./attack-objects-service');
const config = require('../config/config');
const logger = require('../lib/logger');
const { paginate } = require('../lib/pagination');
const { DatabaseError,
    IdentityServiceError,
    MissingParameterError,
    InvalidQueryStringParameterError } = require('../exceptions');
const AbstractService = require('./_abstract.service');

class BaseService extends AbstractService {

    constructor(repository, model) {
        super();
        this.repository = repository;
        this.model = model;
    }

    static paginate(options, results) {
        if (options.includePagination) {
            let derivedTotalCount = 0;
            if (results[0].totalCount && results[0].totalCount.length > 0) {
                derivedTotalCount = results[0].totalCount[0].totalCount;
            }
            return {
                pagination: {
                    total: derivedTotalCount,
                    offset: options.offset,
                    limit: options.limit
                },
                data: results[0].documents
            };
        } else {
            return results[0].documents;
        }
    }

    async retrieveAll(options) {
        let results;
        try {
            results = await this.repository.retrieveAll(options);
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
    }

    async retrieveById(stixId, options) {
        if (!stixId) {
            throw new MissingParameterError({ parameterName: 'stixId' });
        }

        try {
            if (options.versions === 'all') {
                const documents = await this.repository.retrieveAllById(stixId);

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
                const document = await this.repository.retrieveLatestByStixId(stixId);

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
    }

    async retrieveVersionById(stixId, modified) {
        if (!stixId) {
            throw new MissingParameterError({ parameterName: 'stixId' });
        }

        if (!modified) {
            throw new MissingParameterError({ parameterName: 'modified' });
        }

        try {
            const document = await this.repository.retrieveOneByVersion(stixId, modified);

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
    }

    async create(data, options) {
        try {
            // This function handles two use cases:
            //   1. This is a completely new object. Create a new object and generate the stix.id if not already
            //      provided. Set both stix.created_by_ref and stix.x_mitre_modified_by_ref to the organization identity.
            //   2. This is a new version of an existing object. Create a new object with the specified id.
            //      Set stix.x_mitre_modified_by_ref to the organization identity.

            // Create the document
            const document = new this.model(data);

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
                    existingObject = await this.repository.retrieveAllById(document.stix.id);
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
                        // const stixIdPrefix = getStixIdPrefixFromModel(this.model.modelName, document.stix.type);
                        document.stix.id = `${document.stix.type}--${uuid.v4()}`;
                    }

                    // Set the created_by_ref and x_mitre_modified_by_ref properties
                    document.stix.created_by_ref = organizationIdentityRef;
                    document.stix.x_mitre_modified_by_ref = organizationIdentityRef;
                }
            }
            return await this.repository.save(document);
        } catch (err) {
            logger.error(err);
            throw err;
        }
    }

    async updateFull(stixId, stixModified, data) {

        if (!stixId) {
            throw new MissingParameterError({ parameterName: 'stixId' });
        }

        if (!stixModified) {
            throw new MissingParameterError({ parameterName: 'modified' });
        }

        let document;
        try {
            document = await this.repository.retrieveOneByVersion(stixId, stixModified);
        } catch (err) {
            logger.error(err);
            throw err;
        }

        if (!document) {
            return null;
        }

        try {
            const newDocument = await this.repository.updateAndSave(document, data);

            if (newDocument === document) {
                // Document successfully saved
                return newDocument;
            } else {
                logger.error('Document could not be saved.');
                throw new DatabaseError({
                    details: 'Document could not be saved',
                    document // Pass along the document that could not be saved
                });
            }
        } catch (err) {
            logger.error(err);
            throw err;
        }
    }

    async deleteVersionById(stixId, stixModified) {
        if (!stixId) {
            throw new MissingParameterError({ parameterName: 'stixId' });
        }
        if (!stixModified) {
            throw new MissingParameterError({ parameterName: 'modified' });
        }
        try {
            const document = await this.repository.findOneAndRemove(stixId, stixModified);

            if (!document) {
                //Note: document is null if not found
                return null;
            }
            return document;

        } catch (err) {
            logger.error('Failed to retrieve record from the document repository');
            throw err;
        }
    }

    async deleteById(stixId) {
        if (!stixId) {
            return new MissingParameterError({ parameterName: 'stixId' });
        }
        try {
            return await this.repository.deleteMany(stixId);
        } catch (err) {
            logger.error('Failed to delete records from the repository');
            throw err;
        }
    }

}

module.exports = BaseService;