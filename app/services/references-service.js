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

exports.deleteBySourceName = async function (sourceName) {
    if (!sourceName) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'sourceName';
        throw error;
    }

    const deletedReference = await Reference.findOneAndRemove({ 'source_name': sourceName });
    return deletedReference;
};

