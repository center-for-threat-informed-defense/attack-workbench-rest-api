'use strict';

const CollectionIndex = require('../models/collection-index-model');
const config = require('../config/config');

const errors = {
    missingParameter: 'Missing required parameter',
    badlyFormattedParameter: 'Badly formatted parameter',
    duplicateId: 'Duplicate id',
    notFound: 'Document not found',
    invalidQueryStringParameter: 'Invalid query string parameter'
};
exports.errors = errors;

exports.retrieveAll = function(options, callback) {
    CollectionIndex.find()
        .skip(options.offset)
        .limit(options.limit)
        .lean()
        .exec(function(err, collectionIndexes) {
            if (err) {
                return callback(err);
            }
            else {
                return callback(null, collectionIndexes);
            }
        });
};

exports.retrieveById = function(id, callback) {
    if (!id) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'id';
        return callback(error);
    }

    CollectionIndex.findOne({ "collection_index.id": id }, function(err, collectionIndex) {
            if (err) {
                if (err.name === 'CastError') {
                    const error = new Error(errors.badlyFormattedParameter);
                    error.parameterName = 'id';
                    return callback(error);
                } else {
                    return callback(err);
                }
            } else {
                // Note: document is null if not found
                return callback(null, collectionIndex);
            }
        });
};

exports.create = function(data, callback) {
    // Create the document
    const collectionIndex = new CollectionIndex(data);

    if (collectionIndex.workspace.update_policy) {
        if (collectionIndex.workspace.update_policy.automatic && !collectionIndex.workspace.update_policy.interval) {
            collectionIndex.workspace.update_policy.interval = config.collectionIndex.defaultInterval;
        }
    }

    // Save the document in the database
    collectionIndex.save(function(err, collectionIndex) {
        if (err) {
            if (err.name === 'MongoError' && err.code === 11000) {
                // 11000 = Duplicate index
                const error = new Error(errors.duplicateId);
                return callback(error);
            }
            else {
                return callback(err);
            }
        }
        else {
            return callback(null, collectionIndex);
        }
    });
};

exports.updateFull = function(id, data, callback) {
    if (!id) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'id';
        return callback(error);
    }

    CollectionIndex.findOne({ "collection_index.id": id }, function(err, collectionIndex) {
        if (err) {
            if (err.name === 'CastError') {
                var error = new Error(errors.badlyFormattedParameter);
                error.parameterName = 'id';
                return callback(error);
            }
            else {
                return callback(err);
            }
        }
        else if (!collectionIndex) {
            // Collection index not found
            return callback(null);
        }
        else {
            // Copy data to found document and save
            Object.assign(collectionIndex, data);
            collectionIndex.save(function(err, savedCollectionIndex) {
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
                    return callback(null, savedCollectionIndex);
                }
            });
        }
    });
};

exports.delete = function (id, callback) {
    if (!id) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'id';
        return callback(error);
    }

    CollectionIndex.findOneAndRemove({ "collection_index.id": id }, function (err, collectionIndex) {
        if (err) {
            return callback(err);
        } else {
            //Note: collectionIndex is null if not found
            return callback(null, collectionIndex);
        }
    });
};

