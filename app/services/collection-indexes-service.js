'use strict';

const superagent = require('superagent');

const CollectionIndex = require('../models/collection-index-model');
const config = require('../config/config');

class CollectionIndexService {

    constructor(type, repository) {
        this.type = type;
        this.repository = repository;
    }

    errors = {
        badRequest: 'Bad request',
        missingParameter: 'Missing required parameter',
        badlyFormattedParameter: 'Badly formatted parameter',
        duplicateId: 'Duplicate id',
        notFound: 'Document not found',
        hostNotFound: 'Host not found',
        connectionRefused: 'Connection refused',
    };


    exports.retrieveAll = function (options, callback) {
        CollectionIndex.find()
            .skip(options.offset)
            .limit(options.limit)
            .lean()
            .exec(function (err, collectionIndexes) {
                if (err) {
                    return callback(err);
                }
                else {
                    return callback(null, collectionIndexes);
                }
            });
    };

    async retrieveById(id) {
        try {
            if (!id) {
                const error = new Error(errors.missingParameter);
                error.parameterName = 'id';
                throw error;
            }
    
            const collectionIndex = await CollectionIndex.findOne({ "collection_index.id": id });
    
            return collectionIndex; // Note: collectionIndex is null if not found
        } catch (err) {
            if (err.name === 'CastError') {
                const error = new Error(errors.badlyFormattedParameter);
                error.parameterName = 'id';
                throw error;
            } else {
                throw err;
            }
        }
    };
    

    async create(data) {
        try {
            // Create the document
            const collectionIndex = new CollectionIndex(data);
    
            if (collectionIndex.workspace.update_policy && collectionIndex.workspace.update_policy.automatic && !collectionIndex.workspace.update_policy.interval) {
                collectionIndex.workspace.update_policy.interval = config.collectionIndex.defaultInterval;
            }
    
            // Save the document in the database
            const savedCollectionIndex = await collectionIndex.save();
    
            return savedCollectionIndex;
        } catch (err) {
            if (err.name === 'MongoServerError' && err.code === 11000) {
                // 11000 = Duplicate index
                const error = new Error(errors.duplicateId);
                throw error;
            } else {
                throw err;
            }
        }
    };
    

    async updateFull(id, data) {
        try {
            if (!id) {
                const error = new Error(errors.missingParameter);
                error.parameterName = 'id';
                throw error;
            }
    
            const collectionIndex = await CollectionIndex.findOne({ "collection_index.id": id });
    
            if (!collectionIndex) {
                // Collection index not found
                return null;
            }
    
            // Copy data to found document
            Object.assign(collectionIndex, data);
    
            // Save the updated document
            const savedCollectionIndex = await collectionIndex.save();
    
            return savedCollectionIndex;
        } catch (err) {
            if (err.name === 'CastError') {
                const error = new Error(errors.badlyFormattedParameter);
                error.parameterName = 'id';
                throw error;
            } else if (err.name === 'MongoServerError' && err.code === 11000) {
                // 11000 = Duplicate index
                const error = new Error(errors.duplicateId);
                throw error;
            } else {
                throw err;
            }
        }
    };
    

    async delete(id) {
        try {
            if (!id) {
                const error = new Error(errors.missingParameter);
                error.parameterName = 'id';
                throw error;
            }
    
            const collectionIndex = await CollectionIndex.findOneAndRemove({ "collection_index.id": id });
    
            return collectionIndex; // Note: collectionIndex is null if not found
        } catch (err) {
            throw err;
        }
    };
    

    /**
     * Retrieves a collection index from the provided URL.
     * This is expected to be a remote URL that does not require authentication.
     */
    async retrieveByUrl(url) {
        try {
            if (!url) {
                const error = new Error(errors.missingParameter);
                throw error;
            }
    
            const res = await superagent.get(url).set('Accept', 'application/json');
    
            // Handle different error cases
            if (res.notFound) {
                const error = new Error(errors.notFound);
                throw error;
            } else if (res.badRequest) {
                const error = new Error(errors.badRequest);
                throw error;
            }
    
            // Parsing res.text handles both the content-type text/plain and application/json use cases
            const collectionIndex = JSON.parse(res.text);
            return collectionIndex;
        } catch (err) {
            if (err.code === 'ENOTFOUND') {
                throw new Error(errors.hostNotFound);
            } else if (err.code === 'ECONNREFUSED') {
                throw new Error(errors.connectionRefused);
            } else {
                throw err;
            }
        }
    };
    

    async refresh(id) {
        try {
            // Do nothing for now
            await new Promise(resolve => process.nextTick(resolve));
            return {};
        } catch (err) {
            throw err;
        }
    };
    

}