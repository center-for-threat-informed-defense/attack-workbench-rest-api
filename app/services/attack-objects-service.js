'use strict';

const AttackObject = require('../models/attack-object-model');
const identitiesService = require('./identities-service');

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
    if (options.attackId) {
        query['workspace.attack_id'] = options.attackId;
    }
    if (!options.includeRevoked) {
        query['stix.revoked'] = { $in: [null, false] };
    }
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
    // - Group the documents by stix.id, sorted by stix.modified
    // - Use the last document in each group (according to the value of stix.modified)
    // - Then apply query, skip and limit options
    const aggregation = [];
    aggregation.push({ $sort: { 'stix.id': 1, 'stix.modified': 1 } });
    aggregation.push({ $group: { _id: '$stix.id', document: { $last: '$$ROOT' }}});
    aggregation.push({ $replaceRoot: { newRoot: '$document' }});
    aggregation.push({ $sort: { 'stix.id': 1 }});
    aggregation.push({ $match: query });

    if (typeof options.search !== 'undefined') {
        const match = { $match: { $or: [
                    { 'stix.name': { '$regex': options.search, '$options': 'i' }},
                    { 'stix.description': { '$regex': options.search, '$options': 'i' }}
                ]}};
        aggregation.push(match);
    }

    // Retrieve the documents
    const documents = await AttackObject.aggregate(aggregation);

    // Apply pagination
    const offset = options.offset ?? 0;
    const limit = options.limit ?? 0;

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

exports.retrieveVersionById = async function(stixId, modified) {
    // Retrieve the version of the attack object with the matching stixId and modified date

    if (!stixId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'stixId';
        throw error;
    }

    if (!modified) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'modified';
        throw error;
    }

    const attackObject = await AttackObject.findOne({ 'stix.id': stixId, 'stix.modified': modified })
        .catch(err => {
            if (err.name === 'CastError') {
                const error = new Error(errors.badlyFormattedParameter);
                error.parameterName = 'stixId';
                throw error;
            }
            else {
                throw err;
            }
        });

    // Note: attackObject is null if not found
    await identitiesService.addCreatedByAndModifiedByIdentities(attackObject);
    return attackObject;
};

// Record that this object is part of a collection
exports.insertCollection = async function(stixId, modified, collectionId, collectionModified) {
    const attackObject = await AttackObject.findOne({ 'stix.id': stixId, 'stix.modified': modified });

    if (attackObject) {
        // Create the collection reference
        const collection = {
            collection_ref: collectionId,
            collection_modified: collectionModified
        };

        // Make sure the exports array exists and add the collection reference
        if (!attackObject.workspace.collections) {
            attackObject.workspace.collections = [];
        }

        // Check to see if the collection is already added
        // (collection with same id and version should only be created--and therefore objects added--one time)
        const duplicateCollection = attackObject.workspace.collections.find(
            item => item.collection_ref === collection.collection_ref && item.collection_modified === collection.collection_modified);
        if (duplicateCollection) {
            throw new Error(errors.duplicateCollection);
        }

        attackObject.workspace.collections.push(collection);

        await attackObject.save();
    }
    else {
        throw new Error(errors.notFound);
    }
};
