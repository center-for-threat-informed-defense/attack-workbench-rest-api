'use strict';

const superagent = require('superagent');

const CollectionIndex = require('../models/collection-index-model');
const config = require('../config/config');

const errors = {
    badRequest: 'Bad request',
    missingParameter: 'Missing required parameter',
    badlyFormattedParameter: 'Badly formatted parameter',
    duplicateId: 'Duplicate id',
    notFound: 'Document not found',
    hostNotFound: 'Host not found',
    connectionRefused: 'Connection refused',
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
            if (err.name === 'MongoServerError' && err.code === 11000) {
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
                    if (err.name === 'MongoServerError' && err.code === 11000) {
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

/**
 * Retrieves a collection index from the provided URL.
 * This is expected to be a remote URL that does not require authentication.
 */
exports.retrieveByUrl = function(url, callback) {
    if (!url) {
        const error = new Error(errors.missingParameter);
        return callback(error);
    }

    superagent.get(url).set('Accept', 'application/json').end((err, res) => {
        if (err) {
            if (err.response && err.response.notFound) {
                const error = new Error(errors.notFound);
                return callback(error);
            } else if (err.response && err.response.badRequest) {
                const error = new Error(errors.badRequest);
                return callback(error);
            } else if (err.code === 'ENOTFOUND') {
                const error = new Error(errors.hostNotFound);
                return callback(error);
            } else if (err.code === 'ECONNREFUSED') {
                const error = new Error(errors.connectionRefused);
                return callback(error);
            } else {
                return callback(err)
            }
        }
        else {
            try {
                // Parsing res.text handles both the content-type text/plain and application/json use cases
                const collectionIndex = JSON.parse(res.text);
                return callback(null, collectionIndex);
            }
            catch (err) {
                return callback(err);
            }
        }
    });
}

/**
 * Retrieves a list of collection indexes from the Workbench data store.
 */
async function retrieveFromWorkbenchAsync() {
    const options = {
        offset: req.query.offset || 0,
        limit: req.query.limit || 0
    }
    retrieveAll(options, function(err, collectionIndexes) {
        if (err) {
            throw err;
        }
        else {
            logger.debug(`Success: Retrieved ${ collectionIndexes.length } collectionIndex(es)`);
            return collectionIndexes;
        }
    });
}

/**
 * Updates a collection index in the Workbench data store.
 */
async function updateWorkbenchAsync(collectionIndex, callback) {
    updateFull(collectionIndex.collection_index.id, collectionIndex, function(err, collectionIndex) {
        if (err) {
            logger.error("Update collection index failed with error: " + err);
            throw err;
        }
    });
}

exports.retrieveFromWorkbench = function(callback) {
    retrieveFromWorkbenchAsync()
        .then(collectionIndexes => callback(null, collectionIndexes))
        .catch(err => callback(err));
}

exports.updateWorkbench = function(collectionIndex, callback) {
    updateWorkbenchAsync(collectionIndex)
        .then(() => callback(null))
        .catch(err => callback(err));
}

exports.refresh = function(id, callback) {
    // Do nothing for now
    process.nextTick(() => callback(null, {}));
};