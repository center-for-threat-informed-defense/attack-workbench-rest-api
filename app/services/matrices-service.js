'use strict';

const uuid = require('uuid');
const util = require('util');
const Matrix = require('../models/matrix-model');
const systemConfigurationService = require('./system-configuration-service');
const identitiesService = require('./identities-service');
const attackObjectsService = require('./attack-objects-service');
const config = require('../config/config');
const regexValidator = require('../lib/regex');
const {lastUpdatedByQueryHelper} = require('../lib/request-parameter-helper');
const matrixRepository = require('../repository/matrix-repository');

const ErrorType = {
    MissingParameter: 'Missing required parameter',
    BadlyFormattedParameter: 'Badly formatted parameter',
    DuplicateId: 'Duplicate id',
    NotFound: 'Document not found',
    InvalidQueryStringParameter: 'Invalid query string parameter'
};

function processError(errorType, options = {}) {
    if (!ErrorType[errorType]) {
        throw new Error('Unknown error type provided to processError function.');
    }

    const error = new Error(ErrorType[errorType]);

    // Apply options (if defined) to the error object
    for (const key in options) {
        if (Object.prototype.hasOwnProperty.call(options, key)) {
            error[key] = options[key];
        }
    }

    throw error;
};

// TODO why is this being exported?
// exports.errors = ErrorType;

exports.retrieveAll = async function (options) {
    try {
        const results = await matrixRepository.retrieveAll(options);

        await identitiesService.addCreatedByAndModifiedByIdentitiesToAll(results[0].documents);

        if (options.includePagination) {
            let derivedTotalCount = 0;
            if (results[0].totalCount.length > 0) {
                derivedTotalCount = results[0].totalCount[0].totalCount;
            }
            const returnValue = {
                pagination: {
                    total: derivedTotalCount,
                    offset: options.offset,
                    limit: options.limit
                },
                data: results[0].documents
            };
            return returnValue;
        } else {
            return results[0].documents;
        }
    } catch (err) {
        throw err;
    }
};

exports.retrieveById = async function (stixId, options) {
    if (!stixId) {
        return processError(ErrorType.MissingParameter, { parameterName: 'stixId' });
    }

    if (options.versions === 'all') {
        const matrices = await matrixRepository.retrieveAllByStixId(stixId);
        await identitiesService.addCreatedByAndModifiedByIdentitiesToAll(matrices);
        return matrices;
    } else if (options.versions === 'latest') {
        const matrix = await matrixRepository.retrieveLatestByStixId(stixId);
        if (matrix) {
            await identitiesService.addCreatedByAndModifiedByIdentities(matrix);
            return [matrix];
        } else {
            return [];
        }
    } else {
        processError(ErrorType.InvalidQueryStringParameter, { parameterName: 'versions' });
    }
};

exports.retrieveVersionById = async function (stixId, modified) {
    if (!stixId) {
        return processError(ErrorType.MissingParameter, { parameterName: 'stixId' });
    }

    if (!modified) {
        return processError(ErrorType.MissingParameter, { parameterName: 'modified' });
    }

    try {
        const matrix = await matrixRepository.retrieveByVersion(stixId, modified);

        if (!matrix) {
            console.log('** NOT FOUND');
            return null; // TODO should we return NotFound here?
        } else {
            await identitiesService.addCreatedByAndModifiedByIdentities(matrix);
            return matrix;
        }
    } catch (err) {
        throw err;
    }
};


let retrieveTacticById;
let retrieveTechniquesForTactic;
exports.retrieveTechniquesForMatrix = async function (stixId, modified) {
    if (!retrieveTacticById) {
        const tacticsService = require('./tactics-service');
        retrieveTacticById = util.promisify(tacticsService.retrieveById);
    }
    if (!retrieveTechniquesForTactic) {
        const tacticsService = require('./tactics-service');
        retrieveTechniquesForTactic = tacticsService.retrieveTechniquesForTactic;
    }

    if (!stixId) {
        return processError(ErrorType.MissingParameter, { parameterName: 'stixId' });
    }
    if (!modified) {
        return processError(ErrorType.MissingParameter, { parameterName: 'modified' });
    }

    const matrix = await matrixRepository.retrieveByVersion(stixId, modified);

    if (!matrix) {
        return; // TODO should we return NotFound here?
    }

    const options = { versions: 'latest', offset: 0, limit: 0 };
    const tacticsTechniques = {};

    for (const tacticId of matrix.stix.tactic_refs) {
        const tactics = await retrieveTacticById(tacticId, options);
        if (tactics.length) {
            const tactic = tactics[0];
            const techniques = await retrieveTechniquesForTactic(tacticId, tactic.stix.modified, options);
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
exports.create = async function(data, options) {
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

    // Save the document in the database
    try {
        return await matrixRepository.saveMatrix(matrix);
    }
    catch (err) {
        if (err.name === 'MongoServerError' && err.code === 11000) {
            // 11000 = Duplicate index
            return processError(ErrorType.DuplicateId);
        }
        else {
            throw err;
        }
    }
};

exports.updateFull = async function (stixId, stixModified, data) {

    if (!stixId) {
        return processError(ErrorType.MissingParameter, { parameterName: 'stixId' });
    }
    if (!modified) {
        return processError(ErrorType.MissingParameter, { parameterName: 'modified' });
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
            return processError(ErrorType.BadlyFormattedParameter, { parameterName: 'stixId' });
        } else if (err.name === 'MongoServerError' && err.code === 11000) {
            // 11000 = Duplicate index
            return processError(ErrorType.DuplicateId);
        } else {
            throw err;
        }
    }
};

exports.deleteVersionById = async function (stixId, stixModified) {
    if (!stixId) {
        return processError(ErrorType.MissingParameter, { parameterName: 'stixId' });
    }
    if (!modified) {
        return processError(ErrorType.MissingParameter, { parameterName: 'modified' });
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
        return processError(ErrorType.MissingParameter, { parameterName: 'stixId' });
    }
    try {
        return await matrixRepository.deleteMany(stixId);
    } catch (err) {
        throw err;
    }
};
