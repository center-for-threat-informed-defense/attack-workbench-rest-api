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
   * Retrieve every relationship revision whose stored source or target pin
   * exactly matches one of the supplied object revisions.
   *
   * The caller deliberately receives inactive and superseded relationship
   * revisions. Deterministic graph capture must choose the newest revision
   * for an exact endpoint pair before applying active/deprecated filters, or
   * an older active revision could be resurrected.
   */
  async retrieveRevisionsTouchingExactEndpoints(endpointRevisions, options = {}) {
    if (!Array.isArray(endpointRevisions) || endpointRevisions.length === 0) return [];

    const batchSize = options.batchSize || 250;
    const revisionsByKey = new Map();
    try {
      for (let offset = 0; offset < endpointRevisions.length; offset += batchSize) {
        const batch = endpointRevisions.slice(offset, offset + batchSize);
        const exactEndpointQueries = batch.flatMap((entry) => {
          const objectModified = new Date(entry.object_modified);
          return [
            {
              'workspace.relationship_endpoints.source.object_ref': entry.object_ref,
              'workspace.relationship_endpoints.source.object_modified': objectModified,
            },
            {
              'workspace.relationship_endpoints.target.object_ref': entry.object_ref,
              'workspace.relationship_endpoints.target.object_modified': objectModified,
            },
          ];
        });
        const relationships = await this.model.find({ $or: exactEndpointQueries }).lean().exec();
        for (const relationship of relationships) {
          const key = `${relationship.stix.id}::${new Date(relationship.stix.modified).getTime()}`;
          revisionsByKey.set(key, relationship);
        }
      }
      return [...revisionsByKey.values()];
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
    const all_relationships = await this.retrieveAll({
      versions: 'latest',
      lookupRefs: true,
    });

    // Create a mapping of rel_key (source_ref--relationship_type--target_ref)
    // to an array of relationships that share it.
    let rel_map = new Map();
    for (const rel of all_relationships) {
      const rel_key =
        rel.stix.source_ref + '--' + rel.stix.relationship_type + '--' + rel.stix.target_ref;
      if (!rel_map.has(rel_key)) {
        rel_map.set(rel_key, []);
      }
      const entry = rel_map.get(rel_key);
      entry.push(rel);
    }

    // Return only the rel_keys that have more than one item in the array.
    const parallel_relationships = new Map(
      [...rel_map.entries()].filter(([, value]) => value.length > 1),
    );

    return parallel_relationships;
  }
}

module.exports = new RelationshipsRepository(Relationship);
