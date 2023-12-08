'use strict';

const BaseRepository = require('./_base.repository');
const Relationship = require('../models/relationship-model');

class RelationshipsRepository extends BaseRepository { 

    async retrieveAll(options) {
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
        if (typeof options.sourceRef !== 'undefined') {
            query['stix.source_ref'] = options.sourceRef;
        }
        if (typeof options.targetRef !== 'undefined') {
            query['stix.target_ref'] = options.targetRef;
        }
        if (typeof options.sourceOrTargetRef !== 'undefined') {
            query.$or = [{ 'stix.source_ref': options.sourceOrTargetRef }, { 'stix.target_ref': options.sourceOrTargetRef }]
        }
        if (typeof options.relationshipType !== 'undefined') {
            query['stix.relationship_type'] = options.relationshipType;
        }
        if (typeof options.lastUpdatedBy !== 'undefined') {
            query['workspace.workflow.created_by_user_account'] = lastUpdatedByQueryHelper(options.lastUpdatedBy);
        }
    
        // Build the aggregation
        const aggregation = [];
        if (options.versions === 'latest') {
            // - Group the documents by stix.id, sorted by stix.modified
            // - Use the first document in each group (according to the value of stix.modified)
            aggregation.push({ $sort: { 'stix.id': 1, 'stix.modified': -1 } });
            aggregation.push({ $group: { _id: '$stix.id', document: { $first: '$$ROOT' } } });
            aggregation.push({ $replaceRoot: { newRoot: '$document' } });
        }
    
        // Add stages to the aggregation to sort (for pagination), apply the query, and add source and target object data
        aggregation.push({ $sort: { 'stix.id': 1 } });
        aggregation.push({ $match: query });
        if (options.lookupRefs) {
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
        }
        // Retrieve the documents
        let results = await Relationship.aggregate(aggregation);
    
        // Filter out relationships that don't reference the source type
        if (options.sourceType) {
            results = results.filter(document => {
                if (document.source_objects.length === 0) {
                    return false;
                }
                else {
                    document.source_objects.sort((a, b) => b.stix.modified - a.stix.modified);
                    return objectTypeMap.get(document.source_objects[0].stix.type) === options.sourceType;
                }
            });
        }
    
        // Filter out relationships that don't reference the target type
        if (options.targetType) {
            results = results.filter(document => {
                if (document.target_objects.length === 0) {
                    return false;
                }
                else {
                    document.target_objects.sort((a, b) => b.stix.modified - a.stix.modified);
                    return objectTypeMap.get(document.target_objects[0].stix.type) === options.targetType;
                }
            });
        }
    
        const prePaginationTotal = results.length;
    
        // Apply pagination parameters
        if (options.offset || options.limit) {
            const start = options.offset || 0;
            if (options.limit) {
                const end = start + options.limit;
                results = results.slice(start, end);
            }
            else {
                results = results.slice(start);
            }
        }
    
        // Move latest source and target objects to a non-array property, then remove array of source and target objects
        for (const document of results) {
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
    
        if (options.includeIdentities) {
            await identitiesService.addCreatedByAndModifiedByIdentitiesToAll(results);
        }
    
        if (options.includePagination) {
            return {
                pagination: {
                    total: prePaginationTotal,
                    offset: options.offset,
                    limit: options.limit
                },
                data: results
            };
        }
        else {
            return results;
        }
    };
    
}

module.exports = new RelationshipsRepository(Relationship);