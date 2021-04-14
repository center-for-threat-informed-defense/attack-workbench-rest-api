'use strict';

const uuid = require('uuid');
const MarkingDefinition = require('../models/marking-definition-model');
const systemConfigurationService = require('./system-configuration-service');

const errors = {
    missingParameter: 'Missing required parameter',
    badlyFormattedParameter: 'Badly formatted parameter',
    duplicateId: 'Duplicate id',
    notFound: 'Document not found',
    invalidQueryStringParameter: 'Invalid query string parameter'
};
exports.errors = errors;

// NOTE: A marking definition does not support the modified or revoked properties!!

exports.retrieveAll = function(options, callback) {
    // Build the query
    const query = {};
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

    // Build the aggregation
    // - Then apply query, skip and limit options
    const aggregation = [
        { $match: query }
    ];

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
    MarkingDefinition.aggregate(aggregation, function(err, results) {
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
            }
            else {
                return callback(null, results[0].documents);
            }
        }
    });
};

exports.retrieveById = function(stixId, options, callback) {
    if (!stixId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'stixId';
        return callback(error);
    }

    MarkingDefinition.findOne({ 'stix.id': stixId })
        .lean()
        .exec(function(err, markingDefinition) {
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
                if (markingDefinition) {
                    return callback(null, [ markingDefinition ]);
                }
                else {
                    return callback(null, []);
                }
            }
        });
};

exports.createIsAsync = true;
exports.create = async function(data, options) {
    // This function handles two use cases:
    //   1. This is a completely new object. Create a new object and generate the stix.id if not already
    //      provided. Set stix.created_by_ref to the organization identity.
    //   2. stix.id is defined and options.import is set. Create a new object
    //      using the specified stix.id and stix.created_by_ref.
    // TBD: Overwrite existing object when importing??

    // Create the document
    const markingDefinition = new MarkingDefinition(data);

    options = options || {};
    if (!options.import) {
        // Get the organization identity
        const organizationIdentityRef = await systemConfigurationService.retrieveOrganizationIdentityRef();

        // Check for an existing object
        let existingObject;
        if (markingDefinition.stix.id) {
            existingObject = await MarkingDefinition.findOne({ 'stix.id': markingDefinition.stix.id });
        }

        if (existingObject) {
            // Cannot create a new version of an existing object
            const error = new Error(errors.badlyFormattedParameter);
            error.parameterName = 'stixId';
            throw error;
        }
        else {
            // New object
            // Assign a new STIX id if not already provided
            markingDefinition.stix.id = markingDefinition.stix.id || `marking-definition--${uuid.v4()}`;

            // Set the created_by_ref property
            markingDefinition.stix.created_by_ref = organizationIdentityRef;
        }
    }

    // Save the document in the database
    try {
        const savedMarkingDefinition = await markingDefinition.save();
        return savedMarkingDefinition;
    }
    catch(err) {
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

exports.updateFull = function(stixId, data, callback) {
    if (!stixId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'stixId';
        return callback(error);
    }

    MarkingDefinition.findOne({ 'stix.id': stixId }, function(err, document) {
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
                        const error = new Error(errors.duplicateId);
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

exports.delete = function (stixId, callback) {
    if (!stixId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'stixId';
        return callback(error);
    }

    MarkingDefinition.findOneAndRemove({ 'stix.id': stixId }, function (err, markingDefinition) {
        if (err) {
            return callback(err);
        } else {
            //Note: markingDefinition is null if not found
            return callback(null, markingDefinition);
        }
    });
};

