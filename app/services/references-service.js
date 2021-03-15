'use strict';

const Reference = require('../models/reference-model');

const errors = {
    missingParameter: 'Missing required parameter',
    badlyFormattedParameter: 'Badly formatted parameter',
    duplicateId: 'Duplicate id',
    notFound: 'Document not found',
    invalidQueryStringParameter: 'Invalid query string parameter'
};
exports.errors = errors;

exports.retrieveAll = async function(options) {
    // Build the text search
    let textSearch;
    if (typeof options.search !== 'undefined') {
        textSearch = { $text: { $search: options.search }};
    }

    // Build the query
    const query = {};
    if (typeof options.sourceName !== 'undefined') {
        query['source_name'] = options.sourceName;
    }

    // Build the aggregation
    const aggregation = [];
    if (textSearch) {
        aggregation.push({ $match: textSearch });
    }

    aggregation.push({ $sort: { 'source_name': 1 }});
    aggregation.push({ $match: query });

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
    const results = await Reference.aggregate(aggregation);

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
        return returnValue;
    } else {
        return results[0].documents;
    }
};

exports.create = function(data, callback) {
    // Create the document
    const reference = new Reference(data);

    // Save the document in the database
    reference.save(function(err, savedReference) {
        if (err) {
            if (err.name === 'MongoError' && err.code === 11000) {
                // 11000 = Duplicate index
                const error = new Error(errors.duplicateId);
                return callback(error);
            }
            else {
                console.log(`name: ${ err.name } code: ${ err.code }`);
                return callback(err);
            }
        }
        else {
            return callback(null, savedReference);
        }
    });
};

exports.updateFull = function(data, callback) {
    // Note: source_name is used as the key and cannot be updated
    if (!data.source_name) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'source_name';
        return callback(error);
    }

    Reference.findOne({ 'source_name': data.source_name }, function(err, document) {
        if (err) {
            if (err.name === 'CastError') {
                var error = new Error(errors.badlyFormattedParameter);
                error.parameterName = 'source_name';
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

