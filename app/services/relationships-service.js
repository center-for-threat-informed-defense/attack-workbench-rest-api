'use strict';

const uuid = require('uuid');
const Relationship = require('../models/relationship-model');

const errors = {
    missingParameter: 'Missing required parameter',
    badlyFormattedParameter: 'Badly formatted parameter',
    duplicateId: 'Duplicate id',
    notFound: 'Document not found',
    invalidQueryStringParameter: 'Invalid query string parameter'
};
exports.errors = errors;

const objectTypeMap = new Map();
objectTypeMap.set('malware', 'software');
objectTypeMap.set('tool', 'software');
objectTypeMap.set('attack-pattern', 'technique');
objectTypeMap.set('intrusion-set', 'group');
objectTypeMap.set('course-of-action', 'mitigation');
objectTypeMap.set('x-mitre-tactic', 'tactic');
objectTypeMap.set('x-mitre-matrix', 'matrix');

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
    if (typeof options.sourceRef !== 'undefined') {
        query['stix.source_ref'] = options.sourceRef;
    }
    if (typeof options.targetRef !== 'undefined') {
        query['stix.target_ref'] = options.targetRef;
    }
    // TBD: Implement sourceOrTargetRef
    // { $or: [{ source_ref: options.sourceOrTargetRef }, { target_ref: options.sourceOrTargetRef }] }
    if (typeof options.relationshipType !== 'undefined') {
        query['stix.relationship_type'] = options.relationshipType;
    }

    // Build the aggregation
    // - Group the documents by stix.id, sorted by stix.modified
    // - Use the last document in each group (according to the value of stix.modified)
    // - Then apply query, skip and limit options
    const aggregation = [
        { $sort: { 'stix.id': 1, 'stix.modified': 1 } },
        { $group: { _id: '$stix.id', document: { $last: '$$ROOT' }}},
        { $replaceRoot: { newRoot: '$document' }},
        { $sort: { 'stix.id': 1 }},
        { $match: query }
    ];

    const facet = {
        $facet: {
            totalCount: [ { $count: 'totalCount' }],
            documents: [
                { $lookup: { from: 'attackObjects', localField: 'stix.source_ref', foreignField: 'stix.id', as: 'source_objects' }},
                { $lookup: { from: 'attackObjects', localField: 'stix.target_ref', foreignField: 'stix.id', as: 'target_objects' }}
            ]
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
    Relationship.aggregate(aggregation, function(err, results) {
        if (err) {
            return callback(err);
        }
        else {
            if (options.sourceType) {
                // Filter out relationships that don't reference the source type
                results[0].documents = results[0].documents.filter(document =>
                {
                    if (document.source_objects.length === 0) {
                        return false;
                    }
                    else {
                        document.source_objects.sort((a, b) => b.stix.modified - a.stix.modified);
                        return objectTypeMap.get(document.source_objects[0].stix.type) === options.sourceType;
                    }
                });
            }

            if (options.targetType) {
                // Filter out relationships that don't reference the target type
                results[0].documents = results[0].documents.filter(document =>
                {
                    if (document.target_objects.length === 0) {
                        return false;
                    }
                    else {
                        document.target_objects.sort((a, b) => b.stix.modified - a.stix.modified);
                        return objectTypeMap.get(document.target_objects[0].stix.type) === options.targetType;
                    }
                });
            }

            for (const document of results[0].documents) {
                if (document.source_objects.length === 0) {
                    document.source_objects = undefined;
                }
                else {
                    document.source_object = document.source_objects[0];
                    document.source_objects = undefined;
                }

                if (document.target_objects.length === 0) {
                    document.target_objects = undefined;
                }
                else {
                    document.target_object = document.target_objects[0];
                    document.target_objects = undefined;
                }
            }

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
            }
            else {
                return callback(null, results[0].documents);
            }
        }
    });
};

exports.retrieveById = function(stixId, options, callback) {
    // versions=all Retrieve all relationships with the stixId
    // versions=latest Retrieve the relationship with the latest modified date for this stixId

    if (!stixId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'stixId';
        return callback(error);
    }

    if (options.versions === 'all') {
        Relationship.find({'stix.id': stixId})
            .sort('-stix.modified')
            .lean()
            .exec(function (err, relationships) {
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
                    return callback(null, relationships);
                }
            });
    }
    else if (options.versions === 'latest') {
        Relationship.findOne({ 'stix.id': stixId })
            .sort('-stix.modified')
            .lean()
            .exec(function(err, relationship) {
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
                    if (relationship) {
                        return callback(null, [ relationship ]);
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

exports.retrieveVersionById = function(stixId, modified, callback) {
    // Retrieve the versions of the relationship with the matching stixId and modified date

    if (!stixId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'stixId';
        return callback(error);
    }

    if (!modified) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'modified';
        return callback(error);
    }

    Relationship.findOne({ 'stix.id': stixId, 'stix.modified': modified }, function(err, relationship) {
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
            if (relationship) {
                return callback(null, relationship);
            }
            else {
                console.log('** NOT FOUND')
                return callback();
            }
        }
    });
};

exports.create = function(data, callback) {
    // This function handles two use cases:
    //   1. stix.id is undefined. Create a new object and generate the stix.id
    //   2. stix.id is defined. Create a new object with the specified id. This is
    //      a new version of an existing object.
    //      TODO: Verify that the object already exists (?)

    // Create the document
    const relationship = new Relationship(data);

    if (!relationship.stix.id) {
        // Assign a new STIX id
        relationship.stix.id = `attack-pattern--${uuid.v4()}`;
    }

    // Save the document in the database
    relationship.save(function(err, savedRelationship) {
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
            return callback(null, savedRelationship);
        }
    });
};

exports.createAsync = async function(data) {
    // This function handles two use cases:
    //   1. stix.id is undefined. Create a new object and generate the stix.id
    //   2. stix.id is defined. Create a new object with the specified id. This is
    //      a new version of an existing object.
    //      TODO: Verify that the object already exists (?)

    // Create the document
    const relationship = new Relationship(data);

    if (!relationship.stix.id) {
        // Assign a new STIX id
        relationship.stix.id = `attack-pattern--${uuid.v4()}`;
    }

    // Save the document in the database
    try {
        const savedRelationshipe = await relationship.save();
        return savedRelationshipe;
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

exports.updateFull = function(stixId, stixModified, data, callback) {
    if (!stixId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'stixId';
        return callback(error);
    }

    if (!stixModified) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'modified';
        return callback(error);
    }

    Relationship.findOne({ 'stix.id': stixId, 'stix.modified': stixModified }, function(err, document) {
        if (err) {
            if (err.name === 'CastError') {
                var error = new Error(errors.badlyFormattedParameter);
                error.parameterName = 'stixId';
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

exports.delete = function (stixId, stixModified, callback) {
    if (!stixId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'stixId';
        return callback(error);
    }

    if (!stixModified) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'modified';
        return callback(error);
    }

    Relationship.findOneAndRemove({ 'stix.id': stixId, 'stix.modified': stixModified }, function (err, relationship) {
        if (err) {
            return callback(err);
        } else {
            //Note: relationship is null if not found
            return callback(null, relationship);
        }
    });
};

