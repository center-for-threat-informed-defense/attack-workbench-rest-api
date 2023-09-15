'use strict';

const AttackObject = require('../models/attack-object-model');
const Relationship = require('../models/relationship-model');
const identitiesService = require('./identities-service');

const { lastUpdatedByQueryHelper } = require('../lib/request-parameter-helper');

const errors = {
    missingParameter: 'Missing required parameter',
    badlyFormattedParameter: 'Badly formatted parameter',
    duplicateId: 'Duplicate id',
    notFound: 'Document not found',
    invalidQueryStringParameter: 'Invalid query string parameter',
    duplicateCollection: 'Duplicate collection'
};
exports.errors = errors;

exports.retrieveAll = async function(options) {
    // Build the query
    const query = {};
    if (!options.includeRevoked) {
        query['stix.revoked'] = { $in: [null, false] };
    }
    if (!options.includeDeprecated) {
        query['stix.x_mitre_deprecated'] = { $in: [null, false] };
    }
    if (typeof options.lastUpdatedBy !== 'undefined') {
        query['workspace.workflow.created_by_user_account'] = lastUpdatedByQueryHelper(options.lastUpdatedBy);
    }

    // Filter out objects without modified dates (incl. Marking Definitions & Identities)
    query['stix.modified'] = { $exists: true };

    // Build the aggregation
    const aggregation = [];

    // Sort objects by last modified
    aggregation.push({ $sort: { 'stix.modified': -1 } });

    // Limit documents to prevent memory issues
    const limit = options.limit ?? 0;
    if (limit) {
        aggregation.push({ $limit: limit });
    }

    // Then apply query, skip and limit options
    aggregation.push({ $match: query });

    // Retrieve the documents
    const objectDocuments = await AttackObject.aggregate(aggregation);

    // Lookup source/target refs for relationships
    aggregation.push({
        $lookup: {
            from: 'attackObjects',
            localField: 'stix.source_ref',
            foreignField: 'stix.id',
            as: 'source_objects'
        }
    });
    aggregation.push({
        $lookup: {
            from: 'attackObjects',
            localField: 'stix.target_ref',
            foreignField: 'stix.id',
            as: 'target_objects'
        }
    });
    const relationshipDocuments = await Relationship.aggregate(aggregation);
    const documents = objectDocuments.concat(relationshipDocuments);

    // Sort by most recent
    documents.sort((a, b) => b.stix.modified - a.stix.modified);

    // Move latest source and target objects to a non-array property, then remove array of source and target objects
    for (const document of documents) {
        if (Array.isArray(document.source_objects)) {
            if (document.source_objects.length === 0) {
                document.source_objects = undefined;
            }
            else {
                document.source_object = document.source_objects[0];
                document.source_objects = undefined;
            }
        }

        if (Array.isArray(document.target_objects)) {
            if (document.target_objects.length === 0) {
                document.target_objects = undefined;
            }
            else {
                document.target_object = document.target_objects[0];
                document.target_objects = undefined;
            }
        }
    }

    // Apply pagination
    const offset = options.offset ?? 0;
    let paginatedDocuments;
    if (limit > 0) {
        paginatedDocuments = documents.slice(offset, offset + limit);
    }
    else {
        paginatedDocuments = documents.slice(offset);
    }

    // Add identities
    await identitiesService.addCreatedByAndModifiedByIdentitiesToAll(paginatedDocuments);

    // Prepare the return value
    if (options.includePagination) {
        const returnValue = {
            pagination: {
                total: documents.length,
                offset: options.offset,
                limit: options.limit
            },
            data: paginatedDocuments
        };
        return returnValue;
    }
    else {
        return paginatedDocuments;
    }
};
