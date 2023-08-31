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
const { DatabaseError,
    GenericServiceError,
    IdentityServiceError,
    MissingParameterError,
    InvalidQueryStringParameterError } = require('../exceptions');

exports.retrieveAll = async function (options) {
    let results;
    try {
        results = await matrixRepository.findAll(options);
    } catch (err) {
        logger.error('Failed to retrieve records from the matrix repository');
        throw err; // Let the DatabaseError bubble up
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
};

exports.retrieveById = async function (stixId, options) {
    if (!stixId) {
        throw new MissingParameterError({ parameterName: 'stixId' });
    }

    try {
        if (options.versions === 'all') {
            const matrices = await matrixRepository.findAllById(stixId);

            try {
                await identitiesService.addCreatedByAndModifiedByIdentitiesToAll(matrices);
            } catch (err) {
                logger.error('Failed to add identities to all matrices.');
                throw new IdentityServiceError({
                    details: err.message,
                    cause: err
                });
            }

            return matrices;

        } else if (options.versions === 'latest') {
            const matrix = await matrixRepository.findLatestByStixId(stixId);

            if (matrix) {
                try {
                    await identitiesService.addCreatedByAndModifiedByIdentities(matrix);
                } catch (err) {
                    logger.error('Failed to add identities to the latest matrix.');
                    throw new IdentityServiceError({
                        details: err.message,
                        cause: err
                    });
                }

                return [matrix];
            } else {
                return [];
            }

        } else {
            throw new InvalidQueryStringParameterError({ parameterName: 'versions' });
        }
    } catch (err) {
        logger.error('Failed during matrix retrieval by ID.');
        throw err; // Let the DatabaseError bubble up
    }
};

exports.retrieveVersionById = async function (stixId, modified) {
    if (!stixId) {
        throw new MissingParameterError({ parameterName: 'stixId' });
    }

    if (!modified) {
        throw new MissingParameterError({ parameterName: 'modified' });
    }

    try {
        const matrix = await matrixRepository.findOneByVersion(stixId, modified);

        if (!matrix) {
            console.log('** NOT FOUND');
            // TODO determine if we should throw an error here instead of returning null
            // throw new NotFoundError({ ... });
            return null;
        } else {
            try {
                await identitiesService.addCreatedByAndModifiedByIdentities(matrix);
            } catch (err) {
                logger.error('Failed to add identities to the matrix.');
                throw new IdentityServiceError({
                    details: err.message,
                    cause: err
                });
            }
            return matrix;
        }
    } catch (err) {
        logger.error('Failed during matrix retrieval by version and ID.');
        throw err; // Let the DatabaseError bubble up
    }
};


let retrieveTacticById;
let retrieveTechniquesForTactic;

exports.retrieveTechniquesForMatrix = async function (stixId, modified) {
    // Lazy loading of services
    if (!retrieveTacticById || !retrieveTechniquesForTactic) {
        const tacticsService = require('./tactics-service');
        retrieveTacticById = util.promisify(tacticsService.retrieveById);
        retrieveTechniquesForTactic = tacticsService.retrieveTechniquesForTactic;
    }

    if (!stixId) {
        throw new MissingParameterError({ parameterName: 'stixId' });
    }
    if (!modified) {
        throw new MissingParameterError({ parameterName: 'modified' });
    }

    let matrix;
    try {
        matrix = await matrixRepository.findOneByVersion(stixId, modified);
    } catch (err) {
        logger.error('Failed during matrix retrieval by version and ID.');
        throw err; // Let the DatabaseError bubble up
    }

    if (!matrix) {
        // TODO determine if we should throw an error here instead of returning null
        // throw new NotFoundError({ ... });
        return null;
    }

    const options = { versions: 'latest', offset: 0, limit: 0 };
    const tacticsTechniques = {};

    for (const tacticId of matrix.stix.tactic_refs) {
        let tactics, techniques;
        try {
            tactics = await retrieveTacticById(tacticId, options);
            if (tactics && tactics.length) {
                techniques = await retrieveTechniquesForTactic(tacticId, tactics[0].stix.modified, options);
            }
        } catch (err) {
            logger.error('Error while retrieving tactics or techniques.');
            throw new GenericServiceError(err); // TODO it's probably better to throw TechniquesServiceError or TacticsServiceError
        }

        if (tactics && tactics.length) {
            const tactic = tactics[0];
            const parentTechniques = [];
            const subtechniques = [];

            for (const technique of techniques) {
                if (!technique.stix.x_mitre_is_subtechnique) {
                    parentTechniques.push(technique);
                } else {
                    subtechniques.push(technique);
                }
            }

            for (const parentTechnique of parentTechniques) {
                parentTechnique.subtechniques = [];
                for (const subtechnique of subtechniques) {
                    if (subtechnique.workspace.attack_id.split(".")[0] === parentTechnique.workspace.attack_id) {
                        parentTechnique.subtechniques.push(subtechnique);
                    }
                }
            }
            tactic.techniques = parentTechniques;
            tacticsTechniques[tactic.stix.name] = tactic;
        }
    }

    return tacticsTechniques;
};


exports.createIsAsync = true;
exports.create = async function (data, options) {
    try {
        // This function handles two use cases:
        //   1. This is a completely new object. Create a new object and generate the stix.id if not already
        //      provided. Set both stix.created_by_ref and stix.x_mitre_modified_by_ref to the organization identity.
        //   2. This is a new version of an existing object. Create a new object with the specified id.
        //      Set stix.x_mitre_modified_by_ref to the organization identity.

        // Create the document
        const matrix = new Matrix(data);

        options = options || {};
        if (!options.import) {
            // Set the ATT&CK Spec Version
            matrix.stix.x_mitre_attack_spec_version = matrix.stix.x_mitre_attack_spec_version ?? config.app.attackSpecVersion;

            // Record the user account that created the object
            if (options.userAccountId) {
                matrix.workspace.workflow.created_by_user_account = options.userAccountId;
            }

            // Set the default marking definitions
            await attackObjectsService.setDefaultMarkingDefinitions(matrix);

            // Get the organization identity
            const organizationIdentityRef = await systemConfigurationService.retrieveOrganizationIdentityRef();

            // Check for an existing object
            let existingObject;
            if (matrix.stix.id) {
                // existingObject = await Matrix.findOne({ 'stix.id': matrix.stix.id });
                existingObject = await matrixRepository.findAllById(matrix.stix.id);
            }

            if (existingObject) {
                // New version of an existing object
                // Only set the x_mitre_modified_by_ref property
                matrix.stix.x_mitre_modified_by_ref = organizationIdentityRef;
            }
            else {
                // New object
                // Assign a new STIX id if not already provided
                matrix.stix.id = matrix.stix.id || `x-mitre-matrix--${uuid.v4()}`;

                // Set the created_by_ref and x_mitre_modified_by_ref properties
                matrix.stix.created_by_ref = organizationIdentityRef;
                matrix.stix.x_mitre_modified_by_ref = organizationIdentityRef;
            }
        }
        return await matrixRepository.saveMatrix(matrix);
    } catch (err) {
        // TODO this whole function needs more succinct error handling
        logger.error(err);
        throw err;
    }
};

exports.updateFull = async function (stixId, stixModified, data) {
    if (!stixId) {
        throw new MissingParameterError({ parameterName: 'stixId' });
    }
    if (!stixModified) {
        throw new MissingParameterError({ parameterName: 'modified' });
    }

    let document;

    try {
        document = await matrixRepository.findOneByVersion(stixId, stixModified);
    } catch (err) {
        logger.error('An error occured while fetching document by version.');
        throw new DatabaseError({
            details: err.message,
            cause: err
        });
    }

    if (!document) {
        // Document not found
        return null; // TODO should we return NotFound?
    }

    try {
        const newDocument = await matrixRepository.updateAndSave(document, data);
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
        logger.error('Error while updating and saving document.');
        throw new DatabaseError({
            details: err.message,
            cause: err
        });
    }
};

exports.deleteVersionById = async function (stixId, stixModified) {
    if (!stixId) {
        throw new MissingParameterError({ parameterName: 'stixId' });
    }
    if (!stixModified) {
        throw new MissingParameterError({ parameterName: 'modified' });
    }
    try {
        const matrix = await matrixRepository.findOneAndRemove(stixId, stixModified);

        if (!matrix) {
            //Note: matrix is null if not found
            return null;
        }
        return matrix;

    } catch (err) {
        logger.error('Failed to retrieve record from the matrix repository');
        throw err;
    }
};

exports.deleteById = async function (stixId) {
    if (!stixId) {
        return new MissingParameterError({ parameterName: 'stixId' });
    }
    try {
        return await matrixRepository.deleteMany(stixId);
    } catch (err) {
        logger.error('Failed to delete records from the matrix repository');
        throw err;
    }
};
