'use strict';

const AbstractRepository = require('./_repository.abstract');
const regexValidator = require('../lib/regex');
const { lastUpdatedByQueryHelper } = require('../lib/request-parameter-helper');
const { DatabaseError, DuplicateIdError, BadlyFormattedParameterError } = require('../exceptions');

// Set prototype to AbstractRepository to help ensure that all required functions are implemented
Object.setPrototypeOf(exports, AbstractRepository);


exports.retrieveAll = async function (model, options) {
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
        return await model.aggregate(aggregation).exec();
    } catch (err) {
        throw new DatabaseError(err);
    }
};

exports.retrieveOneById = async function (model, stixId) {
    try {
        return await model.findOne({ 'stix.id': stixId }).exec();
    } catch (err) {
        throw new DatabaseError(err);
    }
};

exports.retrieveAllById = async function (model, stixId) {
    try {
        return await model.find({ 'stix.id': stixId })
            .sort('-stix.modified')
            .lean()
            .exec();
    } catch (err) {
        throw new DatabaseError(err);
    }
};

exports.retrieveOneById = async function (model, stixId) {
    try {
        return await model.findOne({ 'stix.id': stixId }).exec();
    } catch (err) {
        throw new DatabaseError(err);
    }
};

exports.retrieveAllById = async function (model, stixId) {
    try {
        return await model.find({ 'stix.id': stixId })
            .sort('-stix.modified')
            .lean()
            .exec();
    } catch (err) {
        throw new DatabaseError(err);
    }
};

exports.retrieveLatestByStixId = async function (model, stixId) {
    try {
        return await model.findOne({ 'stix.id': stixId })
            .sort('-stix.modified')
            .lean()
            .exec();
    } catch (err) {
        throw new DatabaseError(err);
    }
};

exports.retrieveOneByVersion = async function (model, stixId, modified) {
    try {
        return await model.findOne({ 'stix.id': stixId, 'stix.modified': modified })
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

exports.save = async function (model, data) {
    try {
        const document = new model(data);
        return await document.save();
    } catch (err) {
        if (err.name === 'MongoServerError' && err.code === 11000) {
            // Duplicate key error
            throw new DuplicateIdError({
                details: `Document with id '${data.stix.id}' already exists.`
            });
        }
        throw new DatabaseError(err);
    }
};

exports.updateAndSave = async function (document, data) {
    try {
        Object.assign(document, data);
        return await document.save();
    } catch (err) {
        throw new DatabaseError(err);
    }
};

exports.findOneAndRemove = async function (model, stixId, modified) {
    try {
        return await model.findOneAndRemove({ 'stix.id': stixId, 'stix.modified': modified }).exec();
    } catch (err) {
        throw new DatabaseError(err);
    }
};

exports.deleteMany = async function (model, stixId) {
    try {
        return await model.deleteMany({ 'stix.id': stixId }).exec();
    } catch (err) {
        throw new DatabaseError(err);
    }
};