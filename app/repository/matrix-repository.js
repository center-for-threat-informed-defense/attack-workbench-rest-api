'use strict';

const regexValidator = require('../lib/regex');
const { lastUpdatedByQueryHelper } = require('../lib/request-parameter-helper');
const Matrix = require('../models/matrix-model');
const logger = require('../lib/logger');
const RepositoryResponseDTO = require('../dto/repository-response-dto');

exports.retrieveAll = async function (options) {

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
    Matrix.aggregate(aggregation, function (err, results) {
        if (err) {
            return err;
        }
        return new RepositoryResponseDTO({
            totalCount: results[0].totalCount,
            documents: results[0].documents
        });
    });
    // try {
    //     const rawResult = await Matrix.aggregate(aggregation).exec();

    //     return new RepositoryResponseDTO({
    //         totalCount: rawResult[0].totalCount,
    //         documents: rawResult[0].documents
    //     });

    // } catch (error) {
    //     logger.debug('An error occurred while awaiting results from matrix aggregation query.');
    //     logger.debug(error);
    //     throw error;
    // }
};

exports.retrieveByStixId = async function (stixId) {
    return await Matrix.findOne({ 'stix.id': stixId })
        .exec();
};

exports.retrieveAllByStixId = async function (stixId) {
    return await Matrix.find({ 'stix.id': stixId })
        .sort('-stix.modified')
        .lean()
        .exec();
};

exports.retrieveLatestByStixId = async function (stixId) {
    return await Matrix.findOne({ 'stix.id': stixId })
        .sort('-stix.modified')
        .lean()
        .exec();
};

exports.retrieveByVersion = async function (stixId, modified) {
    return await Matrix.findOne({ 'stix.id': stixId, 'stix.modified': modified })
        .lean()
        .exec();
};

exports.saveMatrix = async function (matrixData) {
    const matrix = new Matrix(matrixData);
    return await matrix.save();
};

exports.updateAndSave = async function (document, data) {
    Object.assign(document, data);
    return await document.save();
};

exports.findOneAndRemove = async function (stixId, modified) {
    return await Matrix.findOneAndRemove({ 'stix.id': stixId, 'stix.modified': modified })
        .exec();
};

exports.deleteMany = async function (stixId) {
    return await Matrix.deleteMany({ 'stix.id': stixId }).exec();
};