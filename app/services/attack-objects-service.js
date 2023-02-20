'use strict';

const util = require('util');

const AttackObject = require('../models/attack-object-model');
const Relationship = require('../models/relationship-model');
const identitiesService = require('./identities-service');
const systemConfigurationService = require('./system-configuration-service');

const regexValidator = require('../lib/regex');

const errors = {
    missingParameter: 'Missing required parameter',
    badlyFormattedParameter: 'Badly formatted parameter',
    duplicateId: 'Duplicate id',
    notFound: 'Document not found',
    invalidQueryStringParameter: 'Invalid query string parameter',
    duplicateCollection: 'Duplicate collection',
    invalidType: 'Invalid stix.type'
};
exports.errors = errors;

const relationshipPrefix = 'relationship';

exports.retrieveAll = async function(options) {
    // require here to avoid circular dependency
    const relationshipsService = require('./relationships-service');

    // Build the query
    const query = {};
    if (typeof options.attackId !== 'undefined') {
        if (Array.isArray(options.attackId)) {
            query['workspace.attack_id'] = { $in: options.attackId };
        }
        else {
            query['workspace.attack_id'] = options.attackId;
        }
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
    const aggregation = [];
    if (options.versions === 'latest') {
        // - Group the documents by stix.id, sorted by stix.modified
        // - Use the last document in each group (according to the value of stix.modified)
        aggregation.push({ $sort: { 'stix.id': 1, 'stix.modified': 1 } });
        aggregation.push({ $group: { _id: '$stix.id', document: { $last: '$$ROOT' } } });
        aggregation.push({ $replaceRoot: { newRoot: '$document' } });
    }

    // - Then apply query, skip and limit options
    aggregation.push({ $sort: { 'stix.id': 1 } });
    aggregation.push({ $match: query });

    if (typeof options.search !== 'undefined') {
        options.search = regexValidator.sanitizeRegex(options.search);
        const match = {
            $match: {
                $or: [
                    { 'stix.name': { '$regex': options.search, '$options': 'i' } },
                    { 'stix.description': { '$regex': options.search, '$options': 'i' } }
                ]
            }
        };
        aggregation.push(match);
    }

    // Retrieve the documents
    let documents = await AttackObject.aggregate(aggregation);

    // Add relationships from separate collection
    if (!options.attackId && !options.search) {
        const relationshipsOptions = {
            includeRevoked: options.includeRevoked,
            includeDeprecated: options.includeDeprecated,
            state: options.state,
            versions: options.versions,
            lookupRefs: false,
            includeIdentities: false
        };
        const relationships = await relationshipsService.retrieveAll(relationshipsOptions);
        documents = documents.concat(relationships);
    }

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

    // require here to avoid circular dependency
    const relationshipsService = require('./relationships-service');
    const retrieveRelationshipsVersionById = util.promisify(relationshipsService.retrieveVersionById);

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

    let attackObject;
    if (stixId.startsWith(relationshipPrefix)) {
        attackObject = await retrieveRelationshipsVersionById(stixId, modified);
    }
    else {
        try {
            attackObject = await AttackObject.findOne({ 'stix.id': stixId, 'stix.modified': modified });
        }
        catch(err) {
            if (err.name === 'CastError') {
                const error = new Error(errors.badlyFormattedParameter);
                error.parameterName = 'stixId';
                throw error;
            } else {
                throw err;
            }
        }
    }

    // Note: attackObject is null if not found
    await identitiesService.addCreatedByAndModifiedByIdentities(attackObject);
    return attackObject;
};

// Record that this object is part of a collection
exports.insertCollection = async function(stixId, modified, collectionId, collectionModified) {
    let attackObject;
    if (stixId.startsWith(relationshipPrefix)) {
        attackObject = await Relationship.findOne({ 'stix.id': stixId, 'stix.modified': modified });
    }
    else {
        attackObject = await AttackObject.findOne({ 'stix.id': stixId, 'stix.modified': modified });
    }

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

exports.setDefaultMarkingDefinitions = async function(attackObject) {
    // Add any default marking definitions that are not in the current list for this object
    const defaultMarkingDefinitions = await systemConfigurationService.retrieveDefaultMarkingDefinitions({ refOnly: true });
    if (attackObject.stix.object_marking_refs) {
        attackObject.stix.object_marking_refs = attackObject.stix.object_marking_refs.concat(defaultMarkingDefinitions.filter(e => !attackObject.stix.object_marking_refs.includes(e)));
    }
    else {
        attackObject.stix.object_marking_refs = defaultMarkingDefinitions;
    }
}

exports.makeRetrieveAllSync = function(model, addExtraDataToAll) {
    return function(options, callback) {
        // Build the query
        const query = {};

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

        if (typeof options.domain !== 'undefined') {
            if (Array.isArray(options.domain)) {
                query['stix.x_mitre_domains'] = { $in: options.domain };
            }
            else {
                query['stix.x_mitre_domains'] = options.domain;
            }
        }

        if (typeof options.platform !== 'undefined') {
            if (Array.isArray(options.platform)) {
                query['stix.x_mitre_platforms'] = { $in: options.platform };
            }
            else {
                query['stix.x_mitre_platforms'] = options.platform;
            }
        }

        const softDeleteFilter = { 'workspace.workflow.soft_delete': { $in: [null, false] } };

        // Build the aggregation
        // - Sort by stix.id and stix.modified
        // - Filter out soft deleted documents
        // - Group the documents by stix.id, sorted by stix.modified
        // - Use the last document in each group (according to the value of stix.modified)
        // - Then apply query, skip and limit options
        const aggregation = [];
        aggregation.push({ $sort: { 'stix.id': 1, 'stix.modified': 1 } });
        if (!options.includeDeleted) {
            aggregation.push({ $match: softDeleteFilter });
        }
        aggregation.push({ $group: { _id: '$stix.id', document: { $last: '$$ROOT' } } });
        aggregation.push({ $replaceRoot: { newRoot: '$document' } });
        aggregation.push({ $sort: { 'stix.id': 1 } });
        aggregation.push({ $match: query });

        if (typeof options.search !== 'undefined') {
            options.search = regexValidator.sanitizeRegex(options.search);
            const match = {
                $match: {
                    $or: [
                        { 'stix.name': { '$regex': options.search, '$options': 'i' } },
                        { 'stix.description': { '$regex': options.search, '$options': 'i' } },
                        { 'workspace.attack_id': { '$regex': options.search, '$options': 'i' } }
                    ]
                }
            };
            aggregation.push(match);
        }

        const facet = {
            $facet: {
                totalCount: [{ $count: 'totalCount' }],
                documents: []
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
        model.aggregate(aggregation, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                addExtraDataToAll(results[0].documents)
                    .then(function () {
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
                    });
            }
        });
    }
};

exports.makeRetrieveAllAsync = function(model, addExtraDataToAll) {
    return async function(options) {
        // Build the query
        const query = {};

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

        if (typeof options.domain !== 'undefined') {
            if (Array.isArray(options.domain)) {
                query['stix.x_mitre_domains'] = { $in: options.domain };
            }
            else {
                query['stix.x_mitre_domains'] = options.domain;
            }
        }

        if (typeof options.platform !== 'undefined') {
            if (Array.isArray(options.platform)) {
                query['stix.x_mitre_platforms'] = { $in: options.platform };
            }
            else {
                query['stix.x_mitre_platforms'] = options.platform;
            }
        }

        const softDeleteFilter = { 'workspace.workflow.soft_delete': { $in: [null, false] } };

        // Build the aggregation
        // - Sort by stix.id and stix.modified
        // - Filter out soft deleted documents
        // - Group the documents by stix.id, sorted by stix.modified
        // - Use the last document in each group (according to the value of stix.modified)
        // - Then apply query, skip and limit options
        const aggregation = [];
        aggregation.push({ $sort: { 'stix.id': 1, 'stix.modified': 1 } });
        if (!options.includeDeleted) {
            aggregation.push({ $match: softDeleteFilter });
        }
        aggregation.push({ $group: { _id: '$stix.id', document: { $last: '$$ROOT' } } });
        aggregation.push({ $replaceRoot: { newRoot: '$document' } });
        aggregation.push({ $sort: { 'stix.id': 1 } });
        aggregation.push({ $match: query });

        if (typeof options.search !== 'undefined') {
            options.search = regexValidator.sanitizeRegex(options.search);
            const match = {
                $match: {
                    $or: [
                        { 'stix.name': { '$regex': options.search, '$options': 'i' } },
                        { 'stix.description': { '$regex': options.search, '$options': 'i' } },
                        { 'workspace.attack_id': { '$regex': options.search, '$options': 'i' } }
                    ]
                }
            };
            aggregation.push(match);
        }

        const facet = {
            $facet: {
                totalCount: [{ $count: 'totalCount' }],
                documents: []
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
        const results = await model.aggregate(aggregation);
        await addExtraDataToAll(results[0].documents);

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
    }
};

exports.makeRetrieveByIdSync = function(model, addExtraData, addExtraDataToAll) {
    return function(stixId, options, callback) {
        // versions=all Retrieve all ATT&CK objects with the stixId
        // versions=latest Retrieve the ATT&CK objects with the latest modified date for this stixId

        if (!stixId) {
            const error = new Error(errors.missingParameter);
            error.parameterName = 'stixId';
            return callback(error);
        }

        if (options.versions === 'all') {
            model.find({ 'stix.id': stixId })
                .lean()
                .exec(function (err, attackObjects) {
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
                        if (!options.includeDeleted) {
                            attackObjects = attackObjects.filter(g => !g.workspace.workflow.soft_delete);
                        }
                        addExtraDataToAll(attackObjects, options)
                            .then(() => callback(null, attackObjects));
                    }
                });
        }
        else if (options.versions === 'latest') {
            const query = { 'stix.id': stixId };
            if (!options.includeDeleted) {
                query['workspace.workflow.soft_delete'] = { $in: [null, false] };
            }
            model.findOne(query)
                .sort('-stix.modified')
                .lean()
                .exec(function (err, attackObject) {
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
                        if (attackObject) {
                            addExtraData(attackObject, options)
                                .then(() => callback(null, [ attackObject ]));
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
    }
};

exports.makeRetrieveVersionByIdSync = function(model, addExtraData) {
    return function(stixId, modified, options, callback) {
        // Retrieve the versions of the ATT&CK object with the matching stixId and modified date
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

        model.findOne({ 'stix.id': stixId, 'stix.modified': modified }, function (err, attackObject) {
            if (err) {
                if (err.name === 'CastError') {
                    const error = new Error(errors.badlyFormattedParameter);
                    error.parameterName = 'stixId';
                    return callback(error);
                } else {
                    return callback(err);
                }
            }
            else {
                // Note: document is null if not found
                if (attackObject) {
                    // Filter out a soft deleted document
                    if (attackObject.workspace.workflow.soft_delete && !options.includeDeleted) {
                        return callback();
                    }
                    else {
                        addExtraData(attackObject, options)
                            .then(() => callback(null, attackObject));
                    }
                }
                else {
                    return callback();
                }
            }
        });
    }
};

exports.makeDeleteByIdSync = function(model) {
    return function(stixId, options, callback) {
        if (!stixId) {
            const error = new Error(errors.missingParameter);
            error.parameterName = 'stixId';
            return callback(error);
        }

        if (options.softDelete) {
            model.updateMany(
                { 'stix.id': stixId },
                { $set: { 'workspace.workflow.soft_delete': true } },
                function (err, res) {
                    if (err) {
                        return callback(err);
                    }
                    else {
                        return callback(null, res.modifiedCount);
                    }
                });
        }
        else {
            model.deleteMany(
                { 'stix.id': stixId },
                function (err, res) {
                    if (err) {
                        return callback(err);
                    }
                    else {
                        return callback(null, res.deletedCount);
                    }
                });
        }
    }
}

exports.makeDeleteVersionByIdSync = function(model) {
    return function(stixId, stixModified, options, callback) {
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

        if (options.softDelete) {
            model.findOneAndUpdate(
                { 'stix.id': stixId, 'stix.modified': stixModified },
                { $set: { 'workspace.workflow.soft_delete': true } },
                function (err, deletedDocument) {
                    if (err) {
                        return callback(err);
                    }
                    else {
                        // Note: deletedDocument is null if not found
                        return callback(null, deletedDocument);
                    }
                });
        }
        else {
            model.findOneAndRemove(
                { 'stix.id': stixId, 'stix.modified': stixModified },
                function (err, deletedDocument) {
                    if (err) {
                        return callback(err);
                    }
                    else {
                        // Note: deletedDocument is null if not found
                        return callback(null, deletedDocument);
                    }
                });
        }
    }
};
