'use strict';

const uuid = require('uuid');
const systemConfigurationService = require('./system-configuration-service');
const identitiesService = require('./identities-service');
const attackObjectsService = require('./attack-objects-service');
const config = require('../config/config');
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
            throw new DatabaseError(err); // Let the DatabaseError bubble up
        }

        try {
            await identitiesService.addCreatedByAndModifiedByIdentitiesToAll(results[0].documents);
        } catch (err) {
            throw new IdentityServiceError({
                details: err.message,
                cause: err
            });
        }

        return BaseService.paginate(options, results);
    }

    async retrieveById(stixId, options) {
        if (!stixId) {
            throw new MissingParameterError({ parameterName: 'stixId' });
        }

        // eslint-disable-next-line no-useless-catch
        try {
            if (options.versions === 'all') {
                const documents = await this.repository.retrieveAllById(stixId);

                try {
                    await identitiesService.addCreatedByAndModifiedByIdentitiesToAll(documents);
                } catch (err) {
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

        // eslint-disable-next-line no-useless-catch
        try {
            const document = await this.repository.retrieveOneByVersion(stixId, modified);

            if (!document) {
                console.log('** NOT FOUND');
                return null;
            } else {
                try {
                    await identitiesService.addCreatedByAndModifiedByIdentities(document);
                } catch (err) {
                    throw new IdentityServiceError({
                        details: err.message,
                        cause: err
                    });
                }
                return document;
            }
        } catch (err) {
            throw err; // Let the DatabaseError bubble up
        }
    }

    async create(data, options) {
        // eslint-disable-next-line no-useless-catch
        try {
            // This function handles two use cases:
            //   1. This is a completely new object. Create a new object and generate the stix.id if not already
            //      provided. Set both stix.created_by_ref and stix.x_mitre_modified_by_ref to the organization identity.
            //   2. This is a new version of an existing object. Create a new object with the specified id.
            //      Set stix.x_mitre_modified_by_ref to the organization identity.

            options = options || {};
            if (!options.import) {
                // Set the ATT&CK Spec Version
                data.stix.x_mitre_attack_spec_version = data.stix.x_mitre_attack_spec_version ?? config.app.attackSpecVersion;

                // Record the user account that created the object
                if (options.userAccountId) {
                    data.workspace.workflow.created_by_user_account = options.userAccountId;
                }

                // Set the default marking definitions
                await attackObjectsService.setDefaultMarkingDefinitions(data);

                // Get the organization identity
                const organizationIdentityRef = await systemConfigurationService.retrieveOrganizationIdentityRef();

                // Check for an existing object
                let existingObject;
                if (data.stix.id) {
                    existingObject = await this.repository.retrieveAllById(data.stix.id);
                }

                if (existingObject) {
                    // New version of an existing object
                    // Only set the x_mitre_modified_by_ref property
                    data.stix.x_mitre_modified_by_ref = organizationIdentityRef;
                }
                else {
                    // New object
                    // Assign a new STIX id if not already provided
                    if (!data.stix.id) {
                        // const stixIdPrefix = getStixIdPrefixFromModel(this.model.modelName, data.stix.type);
                        data.stix.id = `${data.stix.type}--${uuid.v4()}`;
                    }

                    // Set the created_by_ref and x_mitre_modified_by_ref properties
                    data.stix.created_by_ref = organizationIdentityRef;
                    data.stix.x_mitre_modified_by_ref = organizationIdentityRef;
                }
            }
            return await this.repository.save(data);
        } catch (err) {
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
        // eslint-disable-next-line no-useless-catch
        try {
            document = await this.repository.retrieveOneByVersion(stixId, stixModified);
        } catch (err) {
            throw err;
        }

        if (!document) {
            return null;
        }

        // eslint-disable-next-line no-useless-catch
        try {
            const newDocument = await this.repository.updateAndSave(document, data);

            if (newDocument === document) {
                // Document successfully saved
                return newDocument;
            } else {
                throw new DatabaseError({
                    details: 'Document could not be saved',
                    document // Pass along the document that could not be saved
                });
            }
        } catch (err) {
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
        // eslint-disable-next-line no-useless-catch
        try {
            const document = await this.repository.findOneAndRemove(stixId, stixModified);

            if (!document) {
                //Note: document is null if not found
                return null;
            }
            return document;

        } catch (err) {
            throw err;
        }
    }

    async deleteById(stixId) {
        if (!stixId) {
            return new MissingParameterError({ parameterName: 'stixId' });
        }
        // eslint-disable-next-line no-useless-catch
        try {
            return await this.repository.deleteMany(stixId);
        } catch (err) {
            throw err;
        }
    }

}

module.exports = BaseService;