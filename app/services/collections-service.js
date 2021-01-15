'use strict';

const Collection = require('../models/collection-model');
const AttackObject = require('../models/attack-object-model');
const async = require('async');

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
    if (!options.includeRevoked) {
        query['stix.revoked'] = { $in: [null, false] };
    }
    if (!options.includeDeprecated) {
        query['stix.x_mitre_deprecated'] = { $in: [null, false] };
    }
    if (typeof options.state !== 'undefined') {
        query['workspace.workflow.state'] = options.state;
    }

    // Build the aggregation
    // - Group the documents by stix.id, sorted by stix.modified
    // - Use the last document in each group (according to the value of stix.modified)
    // - Then apply query, skip and limit options
    const aggregation = [
        { $sort: { 'stix.modified': 1 } },
        { $group: { _id: '$stix.id', document: { $last: '$$ROOT' }}},
        { $replaceRoot: { newRoot: '$document' }},
        { $match: query }
    ];
    if (options.skip) {
        aggregation.push({ $skip: options.skip });
    }
    if (options.limit) {
        aggregation.push({ $limit: options.limit });
    }

    // Retrieve the documents
    Collection.aggregate(aggregation, function(err, collections) {
        if (err) {
            return callback(err);
        }
        else {
            return callback(null, collections);
        }
    });
};

exports.retrieveById = function(stixId, versions, callback) {
    // versions=all Retrieve all collections with the stixId
    // versions=latest Retrieve the collection with the latest modified date for this stixId
    if (!stixId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'stixId';
        return callback(error);
    }

    if (versions === 'all') {
        Collection.find({'stix.id': stixId})
            .lean()
            .exec(function (err, collections) {
                if (err) {
                    if (err.name === 'CastError') {
                        const error = new Error(errors.badlyFormattedParameter);
                        error.parameterName = 'stixId';
                        return callback(error);
                    }
                    else {
                        return callback(err);
                    }
                }
                else {
                    return callback(null, collections);
                }
            });
    }
    else if (versions === 'latest') {
        Collection.findOne({ 'stix.id': stixId })
            .sort('-stix.modified')
            .lean()
            .exec(function(err, collection) {
                if (err) {
                    if (err.name === 'CastError') {
                        const error = new Error(errors.badlyFormattedParameter);
                        error.parameterName = 'stixId';
                        return callback(error);
                    }
                    else {
                        return callback(err);
                    }
                }
                else {
                    // Note: document is null if not found
                    if (collection) {
                        return callback(null, [ collection ]);
                    }
                    else {
                        return callback(null, []);
                    }
                }
            });
    }
    else {
        const error = new Error(errors.invalidQueryStringParameter);
        error.parameterName = 'versions';
        return callback(error);
    }
};

exports.create = function(data, callback) {
    // Create the document
    const collection = new Collection(data);

    // Save the document in the database
    collection.save(function(err, savedCollection) {
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
            return callback(null, savedCollection);
        }
    });
};

exports.delete = function (stixId, deleteAllContents, callback) {
    if (!stixId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'stixId';
        return callback(error);
    }

    Collection.find({'stix.id': stixId})
        .lean()
        .exec(function (err, collections) {
            if (err) {
                if (err.name === 'CastError') {
                    const error = new Error(errors.badlyFormattedParameter);
                    error.parameterName = 'stixId';
                    return callback(error);
                }
                else {
                    return callback(err);
                }
            }
            else {
                const removedCollections = [];
                async.each(collections, function(collection, callback2) {
                        if (deleteAllContents) {
                            async.each(collection.stix.x_mitre_contents, function(reference, callback2a) {
                                AttackObject.findOneAndRemove({ 'stix.id': reference.object_ref, 'stix.modified': reference.object_modified }, function(err, object) {
                                    if (err) {
                                        return callback2a(err);
                                    }
                                    else {
                                        return callback2a();
                                    }
                                });
                            });
                        }

                        Collection.findOneAndRemove({ 'stix.id': collection.stix.id, 'stix.modified': collection.stix.modified }, function (err, collection) {
                            if (err) {
                                return callback2(err);
                            } else {
                                //Note: collection is null if not found
                                if (collection) {
                                    removedCollections.push(collection)
                                }
                                return callback2(null, collection);
                            }
                        });
                    },
                    function(err, results) {
                        if (err) {
                            return callback(err);
                        }
                        else {
                            return callback(null, removedCollections);
                        }
                    });
            }
        });
};
