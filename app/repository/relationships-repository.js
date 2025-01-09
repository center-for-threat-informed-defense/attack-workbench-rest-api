'use strict';

const BaseRepository = require('./_base.repository');
const Relationship = require('../models/relationship-model');
const { lastUpdatedByQueryHelper } = require('../lib/request-parameter-helper');
const { DatabaseError } = require('../exceptions');

class RelationshipsRepository extends BaseRepository {
  async retrieveAll(options) {
    try {
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
        } else {
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
        query.$or = [
          { 'stix.source_ref': options.sourceOrTargetRef },
          { 'stix.target_ref': options.sourceOrTargetRef },
        ];
      }
      if (typeof options.relationshipType !== 'undefined') {
        query['stix.relationship_type'] = options.relationshipType;
      }
      if (typeof options.lastUpdatedBy !== 'undefined') {
        query['workspace.workflow.created_by_user_account'] = lastUpdatedByQueryHelper(
          options.lastUpdatedBy,
        );
      }

      // Build the aggregation
      const aggregation = [];
      if (options.versions === 'latest') {
        aggregation.push({ $sort: { 'stix.id': 1, 'stix.modified': -1 } });
        aggregation.push({ $group: { _id: '$stix.id', document: { $first: '$$ROOT' } } });
        aggregation.push({ $replaceRoot: { newRoot: '$document' } });
      }

      // Add stages for sorting, query, and reference lookups
      aggregation.push({ $sort: { 'stix.id': 1 } });
      aggregation.push({ $match: query });

      if (options.lookupRefs) {
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
      }

      return await this.model.aggregate(aggregation).exec();
    } catch (err) {
      throw new DatabaseError(err);
    }
  }
}

module.exports = new RelationshipsRepository(Relationship);
