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
    }
    else {
        return results[0].documents;
    }
};

exports.create = async function(data) {
    // Create the document
    const reference = new Reference(data);

    // Save the document in the database
    try {
        const savedReference = await reference.save();
        return savedReference;
    }
    catch(err) {
        if (err.name === 'MongoServerError' && err.code === 11000) {
            // 11000 = Duplicate index
            throw new Error(errors.duplicateId);
        } else {
            console.log(`name: ${err.name} code: ${err.code}`);
            throw err;
        }
    }
};

exports.update = async function(data, callback) {
    // Note: source_name is used as the key and cannot be updated
    if (!data.source_name) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'source_name';
        throw error;
    }

    try {
        const document = await Reference.findOne({ 'source_name': data.source_name });
        if (!document) {
            // document not found
            return null;
        }
        else {
            // Copy data to found document and save
            Object.assign(document, data);
            const savedDocument = await document.save();
            return savedDocument;
        }
    }
    catch(err) {
        if (err.name === 'CastError') {
            const error = new Error(errors.badlyFormattedParameter);
            error.parameterName = 'source_name';
            return callback(error);
        }
        else  if (err.name === 'MongoServerError' && err.code === 11000) {
            // 11000 = Duplicate index
            throw new Error(errors.duplicateId);
        } else {
            throw err;
        }
    }
};

exports.deleteBySourceName = async function (sourceName) {
    if (!sourceName) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'sourceName';
        throw error;
    }

    const deletedReference = await Reference.findOneAndRemove({ 'source_name': sourceName });
    return deletedReference;
};

