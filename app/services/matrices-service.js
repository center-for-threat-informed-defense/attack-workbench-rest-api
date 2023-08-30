'use strict';

const uuid = require('uuid');
const util = require('util');
const Matrix = require('../models/matrix-model');
const systemConfigurationService = require('./system-configuration-service');
const identitiesService = require('./identities-service');
const attackObjectsService = require('./attack-objects-service');
const config = require('../config/config');
const matrixRepository = require('../repository/matrix-repository');
const Errors = require('../exceptions');
const logger = require('../lib/logger');
const MatrixDTO = require('../dto/matrix-dto');

exports.retrieveAll = async function (options) {
    let results;
    try {
        results = await matrixRepository.retrieveAll(options);
    } catch (err) {
        throw new Errors.DatabaseError({ detail: 'Failed to retrieve records from the matrix repository.' });
    }

    try {
        await identitiesService.addCreatedByAndModifiedByIdentitiesToAll(results.documents);
    } catch (err) {
        throw new Errors.IdentityServiceError({ detail: 'Failed to add identities to documents.' });
    }

    if (options.includePagination) {
        let derivedTotalCount = 0;
        if (results.totalCount && results.totalCount.length > 0) {
            derivedTotalCount = results.totalCount[0].totalCount;
        }
        return new MatrixDTO({
            total: derivedTotalCount,
            offset: options.offset,
            limit: options.limit,
            documents: results.documents
        });
    } else {
        return results[0].documents;
    }
};

exports.retrieveById = async function (stixId, options) {
    if (!stixId) {
        throw new Errors.MissingParameterError({ parameterName: 'stixId' });
    }

    try {
        if (options.versions === 'all') {
            const matrices = await matrixRepository.retrieveAllByStixId(stixId);

            try {
                await identitiesService.addCreatedByAndModifiedByIdentitiesToAll(matrices);
            } catch (err) {
                throw new Errors.IdentityServiceError({ detail: 'Failed to add identities to all matrices.' });
            }

            return matrices;

        } else if (options.versions === 'latest') {
            const matrix = await matrixRepository.retrieveLatestByStixId(stixId);

            if (matrix) {
                try {
                    await identitiesService.addCreatedByAndModifiedByIdentities(matrix);
                } catch (err) {
                    throw new Errors.IdentityServiceError({ detail: 'Failed to add identities to the latest matrix.' });
                }

                return [matrix];
            } else {
                return [];
            }

        } else {
            throw new Errors.InvalidQueryStringParameterError({ parameterName: 'versions' });
        }
    } catch (err) {
        // If the error is one of our custom errors, re-throw it.
        // Otherwise, encapsulate it in a more general error (optional).
        if (err instanceof Errors.CustomError) {
            throw err;
        } else {
            throw new Errors.DatabaseError({ detail: 'Failed during matrix retrieval by ID.', originalError: err.message });
        }
    }
};

exports.retrieveVersionById = async function (stixId, modified) {
    if (!stixId) {
        throw new Errors.MissingParameterError({ parameterName: 'stixId' });
    }

    if (!modified) {
        throw new Errors.MissingParameterError({ parameterName: 'modified' });
    }

    try {
        const matrix = await matrixRepository.retrieveByVersion(stixId, modified);

        if (!matrix) {
            console.log('** NOT FOUND');
            // TODO determine if we should throw an error here instead of returning null
            // throw new Errors.NotFoundError({ detail: 'Matrix not found for given stixId and modified date.' });
            return null;
        } else {
            try {
                await identitiesService.addCreatedByAndModifiedByIdentities(matrix);
            } catch (err) {
                throw new Errors.IdentityServiceError({ detail: 'Failed to add identities to the matrix.' });
            }

            return matrix;
        }
    } catch (err) {
        if (err instanceof Errors.CustomError) {
            throw err;
        } else {
            throw new Errors.DatabaseError({ detail: 'Failed during matrix retrieval by version and ID.', originalError: err.message });
        }
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
        throw new Errors.MissingParameterError({ parameterName: 'stixId' });
    }
    if (!modified) {
        throw new Errors.MissingParameterError({ parameterName: 'modified' });
    }

    let matrix;
    try {
        matrix = await matrixRepository.retrieveByVersion(stixId, modified);
    } catch (err) {
        throw new Errors.DatabaseError({ detail: 'Failed during matrix retrieval by version and ID.', originalError: err.message });
    }

    if (!matrix) {
        // TODO determine if we should throw an error here instead of returning null
        // throw new Errors.NotFoundError({ detail: 'Matrix not found for given stixId and modified date.' });
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
            throw new Errors.ServiceError({ detail: 'Error while retrieving tactics or techniques.', originalError: err.message });
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
// TODO refactor processError and try/catch
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
                existingObject = await matrixRepository.retrieveAllByStixId(matrix.stix.id);
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
        if (err.name === 'MongoServerError' && err.code === 11000) {
            // Duplicate key error
            throw new Errors.DuplicateIdError({
                detail: `Matrix with id '${matrix.stix.id}' already exists.`
            });
        }
        throw err;
    }
};

exports.updateFull = async function (stixId, stixModified, data) {

    if (!stixId) {
        throw new Errors.MissingParameterError({ parameterName: 'stixId' });
    }
    if (!stixModified) {
        throw new Errors.MissingParameterError({ parameterName: 'modified' });
    }

    try {
        const document = await matrixRepository.retrieveByVersion(stixId, stixModified);

        if (!document) {
            // Document not found
            return null; // TODO should we return NotFound?
        }

        return await matrixRepository.updateAndSave(document, data);
    } catch (err) {
        if (err.name === 'CastError') {
            throw new Errors.BadlyFormattedParameterError({ parameterName: 'stixId' });
        } else if (err.name === 'MongoServerError' && err.code === 11000) {
            throw new Errors.DuplicateIdError();
        }
        throw err;
    }
};

exports.deleteVersionById = async function (stixId, stixModified) {
    if (!stixId) {
        throw new Errors.MissingParameterError({ parameterName: 'stixId' });
    }
    if (!modified) {
        throw new Errors.MissingParameterError({ parameterName: 'modified' });
    }
    try {
        const matrix = await matrixRepository.findOneAndRemove(stixId, stixModified);

        if (!matrix) {
            //Note: matrix is null if not found
            return null;
        }
        return matrix;

    } catch (err) {
        throw err;
    }
};

exports.deleteById = async function (stixId) {
    if (!stixId) {
        return new Errors.MissingParameterError({ parameterName: 'stixId' });
    }
    try {
        return await matrixRepository.deleteMany(stixId);
    } catch (err) {
        throw err;
    }
};
