'use strict';

const regexValidator = require('../lib/regex');
const { lastUpdatedByQueryHelper } = require('../lib/request-parameter-helper');
const Matrix = require('../models/matrix-model');
const { DatabaseError, DuplicateIdError, BadlyFormattedParameterError } = require('../exceptions');


/**
 * @description Retrieves documents based on the provided options, filtering on revoked, deprecated states, etc. The response is aggregated based on 'stix.id' and then filtered according to options like search, offset, and limit.
 * @param {*} options Options object containing various filters and parameters for the search.
 * @returns {Array} Array of aggregated documents.
 */
exports.findAll = async function (options) {
    try {
        // Build the query
        const query = {};

        // Build the query
        if (!options.includeRevoked) {
            query['stix.revoked'] = { $in: [null, false] };
        }
        if (!options.includeDeprecated) {
            query['stix.x_mitre_deprecated'] = { $in: [null, false] };
        }
        if (typeof options.state !== 'undefined') {
            if (Array.isArray(options.state)) {
                query['workspace.workflow.state'] = { $in: options.state };
            }
            else {
                query['workspace.workflow.state'] = options.state;
            }
        }
        if (typeof options.lastUpdatedBy !== 'undefined') {
            query['workspace.workflow.created_by_user_account'] = lastUpdatedByQueryHelper(options.lastUpdatedBy);
        }

        // Build the aggregation
        // - Group the documents by stix.id, sorted by stix.modified
        // - Use the last document in each group (according to the value of stix.modified)
        // - Then apply query, skip and limit options
        const aggregation = [
            { $sort: { 'stix.id': 1, 'stix.modified': 1 } },
            { $group: { _id: '$stix.id', document: { $last: '$$ROOT' } } },
            { $replaceRoot: { newRoot: '$document' } },
            { $sort: { 'stix.id': 1 } },
            { $match: query }
        ];

        if (typeof options.search !== 'undefined') {
            options.search = regexValidator.sanitizeRegex(options.search);
            const match = {
                $match: {
                    $or: [
                        { 'stix.name': { '$regex': options.search, '$options': 'i' } },
                        { 'stix.description': { '$regex': options.search, '$options': 'i' } }
                    ]
                }
            };
            aggregation.push(match);
        }

        const facet = {
            $facet: {
                totalCount: [{ $count: 'totalCount' }],
                documents: []
            }
        };
        if (options.offset) {
            facet.$facet.documents.push({ $skip: options.offset });
        }
        else {
            facet.$facet.documents.push({ $skip: 0 });
        }
        if (options.limit) {
            facet.$facet.documents.push({ $limit: options.limit });
        }
        aggregation.push(facet);

        // Retrieve the documents
        return await Matrix.aggregate(aggregation).exec();
    } catch (err) {
        throw new DatabaseError(err);
    }
};

/**
 * @description Retrieves a single document from the Matrix collection based on a given stixId.
 * @param {*} stixId The STIX identifier of the desired document.
 * @returns {Object} The document associated with the provided stixId.
 */
exports.findOneById = async function (stixId) {
    try {
        return await Matrix.findOne({ 'stix.id': stixId }).exec();
    } catch (err) {
        throw new DatabaseError(err);
    }
};

/**
 * @description Retrieves all versions of a document from the Matrix collection based on a given stixId.
 * @param {*} stixId The STIX identifier of the desired documents.
 * @returns {Array} Array of documents associated with the provided stixId.
 */
exports.findAllById = async function (stixId) {
    try {
        return await Matrix.find({ 'stix.id': stixId })
            .sort('-stix.modified')
            .lean()
            .exec();
    } catch (err) {
        throw new DatabaseError(err);
    }
};

/**
 * @description Retrieves the latest version of a document from the Matrix collection based on a given stixId.
 * @param {*} stixId The STIX identifier of the desired document.
 * @returns {Object} The latest version of the document associated with the provided stixId.
 */
exports.findLatestByStixId = async function (stixId) {
    try {
        return await Matrix.findOne({ 'stix.id': stixId })
            .sort('-stix.modified')
            .lean()
            .exec();
    } catch (err) {
        throw new DatabaseError(err);
    }
};

/**
 * @description Retrieves a specific version of a document from the Matrix collection based on a given stixId and modification timestamp.
 * @param {*} stixId The STIX identifier of the desired document.
 * @param {*} modified The modification timestamp of the desired version.
 * @returns {Object} The specific version of the document associated with the provided stixId and modified timestamp.
 */
exports.findOneByVersion = async function (stixId, modified) {
    try {
        return await Matrix.findOne({ 'stix.id': stixId, 'stix.modified': modified })
            .lean()
            .exec();
    } catch (err) {
        if (err.name === 'CastError') {
            throw new BadlyFormattedParameterError({ parameterName: 'stixId' });
        } else if (err.name === 'MongoServerError' && err.code === 11000) {
            throw new DuplicateIdError();
        }
        throw new DatabaseError(err);
    }
};

/**
 * @description Saves a new matrix data document to the Matrix collection.
 * @param {*} matrixData Data to be saved to the Matrix collection.
 * @returns {Object} The saved matrix data document.
 */
exports.saveMatrix = async function (matrixData) {
    try {
        const matrix = new Matrix(matrixData);
        return await matrix.save();
    } catch (err) {
        if (err.name === 'MongoServerError' && err.code === 11000) {
            // Duplicate key error
            throw new DuplicateIdError({
                details: `Matrix with id '${matrixData.stix.id}' already exists.`
            });
        }
        throw new DatabaseError(err);
    }
};

/**
 * @description Updates an existing document with new data and then saves it.
 * @param {*} document The existing document to be updated.
 * @param {*} data The new data to be added/updated in the document.
 * @returns {Object} The updated and saved document.
 */
exports.updateAndSave = async function (document, data) {
    try {
        Object.assign(document, data);
        return await document.save();
    } catch (err) {
        throw new DatabaseError(err);
    }
};

/**
 * @description Finds a specific version of a document based on a given stixId and modification timestamp, and then removes it from the Matrix collection.
 * @param {*} stixId The STIX identifier of the desired document.
 * @param {*} modified The modification timestamp of the desired version.
 * @returns {Object} Details of the removal operation.
 */
exports.findOneAndRemove = async function (stixId, modified) {
    try {
        return await Matrix.findOneAndRemove({ 'stix.id': stixId, 'stix.modified': modified }).exec();
    } catch (err) {
        throw new DatabaseError(err);
    }
};

/**
 * @description Removes all versions of a document from the Matrix collection based on a given stixId.
 * @param {*} stixId The STIX identifier of the documents to be removed.
 * @returns {Object} Details of the removal operation.
 */
exports.deleteMany = async function (stixId) {
    try {
        return await Matrix.deleteMany({ 'stix.id': stixId }).exec();
    } catch (err) {
        throw new DatabaseError(err);
    }
};