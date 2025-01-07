'use strict';

const BaseRepository = require('./_base.repository');
const Relationship = require('../models/relationship-model');
const { DatabaseError } = require('../exceptions');

class RelationshipsRepository extends BaseRepository {
  /**
   * Extends BaseRepository.retrieveAll() to include relationship-specific query parameters
   * and data lookup functionality.
   *
   * Additional options supported beyond base implementation:
   * @param {Object} options
   * @param {string} options.sourceRef - Filter by source reference
   * @param {string} options.targetRef - Filter by target reference
   * @param {string} options.sourceOrTargetRef - Filter by either source or target reference
   * @param {string} options.relationshipType - Filter by relationship type
   * @param {boolean} options.lookupRefs - Include source/target object data via $lookup
   *
   * @returns {Promise<Array>} Array of relationship documents with optional source/target data
   */
  async retrieveAll(options) {
    try {
      const query = this._buildBaseQuery(options);
      const aggregation = RelationshipsRepository._buildAggregation(options, query);
      return await this.model.aggregate(aggregation).exec();
    } catch (err) {
      throw new DatabaseError(err);
    }
  }

  _buildBaseQuery(options) {
    const query = super._buildBaseQuery(options);

    if (options.sourceRef) {
      query['stix.source_ref'] = options.sourceRef;
    }
    if (options.targetRef) {
      query['stix.target_ref'] = options.targetRef;
    }
    if (options.sourceOrTargetRef) {
      query.$or = [
        { 'stix.source_ref': options.sourceOrTargetRef },
        { 'stix.target_ref': options.sourceOrTargetRef },
      ];
    }
    if (options.relationshipType) {
      query['stix.relationship_type'] = options.relationshipType;
    }
    return query;
  }

  static _buildAggregation(options, query) {
    const aggregation = [{ $sort: { 'stix.id': 1, 'stix.modified': -1 } }];

    if (options.versions === 'latest') {
      aggregation.push(
        { $group: { _id: '$stix.id', document: { $first: '$$ROOT' } } },
        { $replaceRoot: { newRoot: '$document' } },
      );
    }

    aggregation.push({ $sort: { 'stix.id': 1 } }, { $match: query });

    if (options.lookupRefs) {
      aggregation.push(
        {
          $lookup: {
            from: 'attackObjects',
            localField: 'stix.source_ref',
            foreignField: 'stix.id',
            as: 'source_objects',
          },
        },
        {
          $lookup: {
            from: 'attackObjects',
            localField: 'stix.target_ref',
            foreignField: 'stix.id',
            as: 'target_objects',
          },
        },
      );
    }

    return RelationshipsRepository._addPaginationStages(aggregation, options);
  }

  static _addPaginationStages(aggregation, options) {
    const facet = {
      $facet: {
        totalCount: [{ $count: 'totalCount' }],
        documents: [],
      },
    };

    if (options.offset) {
      facet.$facet.documents.push({ $skip: options.offset });
    }
    if (options.limit) {
      facet.$facet.documents.push({ $limit: options.limit });
    }

    aggregation.push(facet);
    return aggregation;
  }
}

module.exports = new RelationshipsRepository(Relationship);
