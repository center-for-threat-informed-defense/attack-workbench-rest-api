'use strict';

const uuid = require('uuid');
const UserAccount = require('../models/user-account-model');

const errors = {
    missingParameter: 'Missing required parameter',
    badlyFormattedParameter: 'Badly formatted parameter',
    duplicateId: 'Duplicate id',
    notFound: 'Document not found',
    invalidQueryStringParameter: 'Invalid query string parameter'
};
exports.errors = errors;

exports.retrieveAll = function(options, callback) {
    // Build the query
    const query = {};
    if (typeof options.status !== 'undefined') {
        if (Array.isArray(options.status)) {
            query['status'] = { $in: options.status };
        }
        else {
            query['status'] = options.status;
        }
    }

    if (typeof options.role !== 'undefined') {
        if (Array.isArray(options.role)) {
            query['role'] = { $in: options.role };
        }
        else {
            query['role'] = options.role;
        }
    }

    // Build the aggregation
    // - Then apply query, skip and limit options
    const aggregation = [
        { $sort: { 'username': 1 } },
        { $match: query }
    ];

    if (typeof options.search !== 'undefined') {
        const match = { $match: { $or: [
                    { 'username': { '$regex': options.search, '$options': 'i' }},
                    { 'email': { '$regex': options.search, '$options': 'i' }}
                ]}};
        aggregation.push(match);
    }

    const facet = {
        $facet: {
            totalCount: [ { $count: 'totalCount' }],
            documents: [ ]
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
    UserAccount.aggregate(aggregation, function(err, results) {
        if (err) {
            return callback(err);
        }
        else {
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
                return callback(null, returnValue);
            } else {
                return callback(null, results[0].documents);
            }
        }
    });
};

exports.retrieveById = function(userAccountId, callback) {
    if (!userAccountId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'userId';
        return callback(error);
    }

    UserAccount.findOne({ 'id': userAccountId })
        .lean()
        .exec(function (err, userAccount) {
            if (err) {
                if (err.name === 'CastError') {
                    const error = new Error(errors.badlyFormattedParameter);
                    error.parameterName = 'userId';
                    return callback(error);
                } else {
                    return callback(err);
                }
            } else {
                return callback(null, userAccount);
            }
        });
};

exports.retrieveByEmail = async function(email) {
    if (!email) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'email';
        throw error;
    }

    try {
        const userAccount = await UserAccount.findOne({ 'email': email }).lean();
        return userAccount;
    }
    catch(err) {
        if (err.name === 'CastError') {
            const error = new Error(errors.badlyFormattedParameter);
            error.parameterName = 'email';
            throw error;
        } else {
            throw err;
        }
    }
};

exports.createIsAsync = true;
exports.create = async function(data, options) {
    // Create the document
    const userAccount = new UserAccount(data);

    userAccount.id = `user-account--${uuid.v4()}`;

    // Save the document in the database
    try {
        const savedUserAccount = await userAccount.save();
        return savedUserAccount;
    }
    catch (err) {
        if (err.name === 'MongoError' && err.code === 11000) {
            // 11000 = Duplicate index
            const error = new Error(errors.duplicateId);
            throw error;
        }
        else {
            throw err;
        }
    }
};

exports.updateFull = function(userAccountId, data, callback) {
    if (!userAccountId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'userId';
        return callback(error);
    }

    UserAccount.findOne({ 'id': userAccountId }, function(err, document) {
        if (err) {
            if (err.name === 'CastError') {
                var error = new Error(errors.badlyFormattedParameter);
                error.parameterName = 'userId';
                return callback(error);
            }
            else {
                return callback(err);
            }
        }
        else if (!document) {
            // document not found
            return callback(null);
        }
        else {
            // Copy data to found document and save
            Object.assign(document, data);
            document.save(function(err, savedDocument) {
                if (err) {
                    if (err.name === 'MongoError' && err.code === 11000) {
                        // 11000 = Duplicate index
                        var error = new Error(errors.duplicateId);
                        return callback(error);
                    }
                    else {
                        return callback(err);
                    }
                }
                else {
                    return callback(null, savedDocument);
                }
            });
        }
    });
};

exports.delete = function (userAccountId, callback) {
    if (!userAccountId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'userId';
        return callback(error);
    }

    UserAccount.findOneAndRemove({ 'id': userAccountId }, function (err, userAccount) {
        if (err) {
            return callback(err);
        } else {
            //Note: userAccount is null if not found
            return callback(null, userAccount);
        }
    });
};

