'use strict';

const AttackObject = require('../models/attack-object-model');
const RelationshipModel = require("../models/relationship-model");

class RecentActivityRepository {

    constructor(attackObjectModel, relationshipModel) {
        this.attackObjectModel = attackObjectModel;
        this.relationshipModel = relationshipModel;
    }

    async retrieveAll() {
        // Build the query
        const query = {};
        if (!options.includeRevoked) {
            query['stix.revoked'] = { $in: [null, false] };
        }
        if (!options.includeDeprecated) {
            query['stix.x_mitre_deprecated'] = { $in: [null, false] };
        }
        if (typeof options.lastUpdatedBy !== 'undefined') {
            query['workspace.workflow.created_by_user_account'] = lastUpdatedByQueryHelper(
                options.lastUpdatedBy,
            );
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
        const objectDocuments = await this.attackObjectModel.aggregate(aggregation);

        // Lookup source/target refs for relationships
        aggregation.push({
            $lookup: {
                from: 'attackObjects',
                localField: 'stix.source_ref',
                foreignField: 'stix.id',
                as: 'source_objects',
            },
        });
        aggregation.push({
            $lookup: {
                from: 'attackObjects',
                localField: 'stix.target_ref',
                foreignField: 'stix.id',
                as: 'target_objects',
            },
        });
        const relationshipDocuments = await this.relationshipModel.aggregate(aggregation);
        const documents = objectDocuments.concat(relationshipDocuments);

        // Sort by most recent
        documents.sort((a, b) => b.stix.modified - a.stix.modified)

        return documents;
    }
}

module.exports = new RecentActivityRepository(AttackObject, RelationshipModel)