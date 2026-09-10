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

  async retrieveAllForBundle(options) {
    try {
      const query = {};
      if (!options.includeRevoked) {
        query['stix.revoked'] = { $in: [null, false] };
      }
      if (!options.includeDeprecated) {
        query['stix.x_mitre_deprecated'] = { $in: [null, false] };
      }
      if (typeof options.state !== 'undefined') {
        query['workspace.workflow.state'] = Array.isArray(options.state)
          ? { $in: options.state }
          : options.state;
      }
      if (Array.isArray(options.objectRefs)) {
        query['stix.source_ref'] = { $in: options.objectRefs };
        query['stix.target_ref'] = { $in: options.objectRefs };
      }

      const aggregation = [
        { $sort: { 'stix.id': 1, 'stix.modified': -1 } },
        { $group: { _id: '$stix.id', document: { $first: '$$ROOT' } } },
        { $replaceRoot: { newRoot: '$document' } },
        { $match: query },
      ];

      return await this.model.aggregate(aggregation).exec();
    } catch (err) {
      throw new DatabaseError(err);
    }
  }

  /**
   * Retrieve the current revision of relationship lineages that still touch
   * any object in a bounded graph frontier. The first indexed lookup finds
   * candidate lineages; the second aggregation deliberately chooses each
   * lineage's globally latest revision before reapplying the endpoint filter.
   * This avoids treating an older, once-relevant revision as current.
   */
  async retrieveLatestTouchingObjectRefs(objectRefs, options = {}) {
    if (!Array.isArray(objectRefs) || objectRefs.length === 0) return [];

    try {
      const endpointQuery = {
        $or: [
          { 'stix.source_ref': { $in: objectRefs } },
          { 'stix.target_ref': { $in: objectRefs } },
        ],
      };
      const candidateIds = await this.model.distinct('stix.id', endpointQuery).exec();
      if (candidateIds.length === 0) return [];

      const currentQuery = { ...endpointQuery };
      if (!options.includeRevoked) {
        currentQuery['stix.revoked'] = { $in: [null, false] };
      }
      if (!options.includeDeprecated) {
        currentQuery['stix.x_mitre_deprecated'] = { $in: [null, false] };
      }

      return await this.model
        .aggregate([
          { $match: { 'stix.id': { $in: candidateIds } } },
          { $sort: { 'stix.id': 1, 'stix.modified': -1 } },
          { $group: { _id: '$stix.id', document: { $first: '$$ROOT' } } },
          { $replaceRoot: { newRoot: '$document' } },
          { $match: currentQuery },
        ])
        .exec();
    } catch (err) {
      throw new DatabaseError(err);
    }
  }

  /**
   * Retrieve the newest revision of every relationship lineage whose source
   * and target IDs are both in the supplied object set, regardless of
   * lifecycle state. Sealing chooses each lineage's globally latest revision
   * before applying active/deprecated filters so an older active revision is
   * never resurrected by a newer inactive one.
   *
   * @param {Array<string>} objectRefs - Member STIX IDs
   * @param {Object} [options]
   * @param {number} [options.batchSize]
   * @returns {Promise<Array<Object>>} Lean relationship documents
   */
  async retrieveLatestBetween(objectRefs, options = {}) {
    if (!Array.isArray(objectRefs) || objectRefs.length === 0) return [];

    const batchSize = options.batchSize || 2000;
    try {
      const lineageIds = new Set();
      for (let offset = 0; offset < objectRefs.length; offset += batchSize) {
        const batch = objectRefs.slice(offset, offset + batchSize);
        const ids = await this.model
          .distinct('stix.id', {
            'stix.source_ref': { $in: batch },
            'stix.target_ref': { $in: objectRefs },
          })
          .exec();
        for (const id of ids) lineageIds.add(id);
      }
      if (lineageIds.size === 0) return [];

      const results = [];
      const allIds = [...lineageIds];
      for (let offset = 0; offset < allIds.length; offset += batchSize) {
        const batch = allIds.slice(offset, offset + batchSize);
        const latest = await this.model
          .aggregate([
            { $match: { 'stix.id': { $in: batch } } },
            { $sort: { 'stix.id': 1, 'stix.modified': -1 } },
            { $group: { _id: '$stix.id', document: { $first: '$$ROOT' } } },
            { $replaceRoot: { newRoot: '$document' } },
          ])
          .exec();
        results.push(...latest);
      }
      return results;
    } catch (err) {
      throw new DatabaseError(err);
    }
  }

  async retrieveAllWithAttackURLInDescription() {
    const aggregation = [
      { $sort: { 'stix.id': 1, 'stix.modified': -1 } },
      { $group: { _id: '$stix.id', document: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$document' } },
      { $sort: { 'stix.id': 1 } },
      {
        $match: {
          'stix.revoked': { $in: [null, false] },
          'stix.x_mitre_deprecated': { $in: [null, false] },
          'stix.description': { $regex: 'attack.mitre.org', $options: 'i' },
        },
      },
    ];

    return await this.model.aggregate(aggregation).exec();
  }

  /**
   * Retrieve the latest version of all relationships where source_ref or target_ref matches the given STIX ID
   * @param {string} stixId - The STIX ID to match against source_ref and target_ref
   * @returns {Promise<Array>} Array of latest-version relationship documents
   */
  async retrieveAllBySourceOrTarget(stixId) {
    try {
      const aggregation = [
        { $sort: { 'stix.id': 1, 'stix.modified': -1 } },
        { $group: { _id: '$stix.id', document: { $first: '$$ROOT' } } },
        { $replaceRoot: { newRoot: '$document' } },
        {
          $match: {
            $or: [{ 'stix.source_ref': stixId }, { 'stix.target_ref': stixId }],
          },
        },
      ];
      return await this.model.aggregate(aggregation).exec();
    } catch (err) {
      throw new DatabaseError(err);
    }
  }

  /**
   * Delete all relationship documents (all versions) where source_ref or target_ref matches,
   * excluding relationships with specified STIX IDs
   * @param {string} stixId - The STIX ID to match against source_ref and target_ref
   * @param {Array<string>} excludeStixIds - STIX IDs of relationships to exclude from deletion
   * @returns {Promise<{deletedCount: number}>} Deletion result
   */
  async deleteManyBySourceOrTarget(stixId, excludeStixIds = []) {
    try {
      const query = {
        $or: [{ 'stix.source_ref': stixId }, { 'stix.target_ref': stixId }],
      };
      if (excludeStixIds.length > 0) {
        query['stix.id'] = { $nin: excludeStixIds };
      }
      return await this.model.deleteMany(query).exec();
    } catch (err) {
      throw new DatabaseError(err);
    }
  }

  async retrieveParallelRelationships() {
    // Keep only compact selection fields through both grouping stages. In
    // particular, never join endpoint histories for the entire relationship set.
    const aggregation = [
      { $sort: { 'stix.id': 1, 'stix.modified': -1 } },
      {
        $project: {
          'stix.id': 1,
          'stix.source_ref': 1,
          'stix.target_ref': 1,
          'stix.relationship_type': 1,
          'stix.revoked': 1,
          'stix.x_mitre_deprecated': 1,
        },
      },
      { $group: { _id: '$stix.id', document: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$document' } },
      // Filter after selecting latest revisions so old active revisions cannot reappear.
      {
        $match: {
          'stix.revoked': { $in: [null, false] },
          'stix.x_mitre_deprecated': { $in: [null, false] },
        },
      },
      {
        $group: {
          _id: {
            source: '$stix.source_ref',
            type: '$stix.relationship_type',
            target: '$stix.target_ref',
          },
          ids: { $push: '$_id' },
          count: { $sum: 1 },
        },
      },
      { $match: { count: { $gt: 1 } } },
      { $unwind: '$ids' },
      {
        $lookup: {
          from: this.model.collection.name,
          localField: 'ids',
          foreignField: '_id',
          as: 'relationship',
        },
      },
      { $unwind: '$relationship' },
      { $replaceRoot: { newRoot: '$relationship' } },
      { $sort: { 'stix.id': 1 } },
    ];
    for (const endpoint of ['source', 'target']) {
      aggregation.push({
        $lookup: {
          from: 'attackObjects',
          localField: `stix.${endpoint}_ref`,
          foreignField: 'stix.id',
          pipeline: [{ $sort: { 'stix.modified': -1 } }, { $limit: 1 }],
          as: `${endpoint}_objects`,
        },
      });
    }

    const cursor = this.model.aggregate(aggregation).allowDiskUse(true).cursor({ batchSize: 100 });
    const relationshipMap = new Map();
    try {
      for await (const relationship of cursor) {
        const { source_ref, relationship_type, target_ref } = relationship.stix;
        const key = `${source_ref}--${relationship_type}--${target_ref}`;
        if (!relationshipMap.has(key)) relationshipMap.set(key, []);
        relationshipMap.get(key).push(relationship);
      }
    } finally {
      await cursor.close();
    }
    return relationshipMap;
  }
}

module.exports = new RelationshipsRepository(Relationship);
