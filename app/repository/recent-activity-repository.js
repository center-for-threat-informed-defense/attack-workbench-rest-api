'use strict';

const BaseRepository = require('./_base.repository');
const AttackObject = require('../models/attack-object-model');
const Relationship = require('../models/relationship-model');
const { lastUpdatedByQueryHelper } = require('../lib/request-parameter-helper');


class RecentActivityRepository extends BaseRepository {

    constructor(attackModel, relationshipModel) {
        super(attackModel);  // Call the parent constructor with the attackModel (will set this.model)
        this.attackModel = attackModel;
        this.relationshipModel = relationshipModel;
    }

    async retrieveAll(options) {
        const query = RecentActivityRepository._buildQuery(options);
        const aggregation = RecentActivityRepository._buildAggregation(options, query);

        const objectDocuments = await this.attackModel.aggregate(aggregation);
        const relationshipDocuments = await this.relationshipModel.aggregate(aggregation);

        return objectDocuments.concat(relationshipDocuments);
    }

    static _buildQuery(options) {
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
        query['stix.modified'] = { $exists: true };
        return query;
    }

    static _buildAggregation(options, query) {
        const aggregation = [
            { $sort: { 'stix.modified': -1 } },
            { $match: query }
        ];

        const limit = options.limit ?? 0;
        if (limit) {
            aggregation.push({ $limit: limit });
        }

        aggregation.push(
            {
                $lookup: {
                    from: 'attackObjects',
                    localField: 'stix.source_ref',
                    foreignField: 'stix.id',
                    as: 'source_objects'
                }
            },
            {
                $lookup: {
                    from: 'attackObjects',
                    localField: 'stix.target_ref',
                    foreignField: 'stix.id',
                    as: 'target_objects'
                }
            }
        );

        return aggregation;
    }
}

module.exports = new RecentActivityRepository(AttackObject, Relationship);