'use strict';

const regexValidator = require('../lib/regex');
const { lastUpdatedByQueryHelper } = require('../lib/request-parameter-helper');
const Matrix = require('../models/matrix-model');
const Errors = require('../exceptions');

exports.retrieveAll = function (options) {

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
    return Matrix.aggregate(aggregation).exec();
};

exports.retrieveByStixId = function (stixId) {
    return Matrix.findOne({ 'stix.id': stixId })
        .exec();
};

exports.retrieveAllByStixId = function (stixId) {
    return Matrix.find({ 'stix.id': stixId })
        .sort('-stix.modified')
        .lean()
        .exec();
};

exports.retrieveLatestByStixId = function (stixId) {
    return Matrix.findOne({ 'stix.id': stixId })
        .sort('-stix.modified')
        .lean()
        .exec();
};

exports.retrieveByVersion = function (stixId, modified) {
    return Matrix.findOne({ 'stix.id': stixId, 'stix.modified': modified })
        .lean()
        .exec();
};

exports.saveMatrix = async function (matrixData) {
    try {
        const matrix = new Matrix(matrixData);
        return await matrix.save();
    } catch (err) {
        if (err.name === 'MongoServerError' && err.code === 11000) {
            // Duplicate key error
            throw new Errors.DuplicateIdError({
                detail: `Matrix with id '${matrixData.stix.id}' already exists.`
            });
        }
        throw err;
    }
};

exports.updateAndSave = function (document, data) {
    Object.assign(document, data);
    return document.save();
};

exports.findOneAndRemove = function (stixId, modified) {
    return Matrix.findOneAndRemove({ 'stix.id': stixId, 'stix.modified': modified })
        .exec();
};

exports.deleteMany = function (stixId) {
    return Matrix.deleteMany({ 'stix.id': stixId }).exec();
};