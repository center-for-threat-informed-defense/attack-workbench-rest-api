'use strict';

const BaseRepository = require('./_base.repository');
const Matrix = require('../models/matrix-model');
const { DatabaseError } = require('../exceptions');

class MatrixRepository extends BaseRepository {
  /**
   * Retrieves matrices for STIX bundle export without domain filtering at the database level.
   * Unlike other STIX objects where domain filtering happens in the database query,
   * matrices are filtered by domain after retrieval by checking their external_references.
   *
   * This matches the original implementation where:
   * 1. Matrices are queried with basic filters (revoked, deprecated, state)
   * 2. Domain matching happens in memory by checking external_references[0].external_id
   *
   * @param {Object} options Query options
   * @param {boolean} [options.includeRevoked=false] Include revoked matrices
   * @param {boolean} [options.includeDeprecated=false] Include deprecated matrices
   * @param {string|string[]} [options.state] Filter by workflow state
   * @returns {Promise<Array>} Matrices matching the query criteria
   * @throws {DatabaseError} If database query fails
   */
  async retrieveAllForBundle(options) {
    try {
      // Build query without domain filter
      const query = {};

      // Handle revoked status
      if (!options.includeRevoked) {
        query['stix.revoked'] = { $in: [null, false] };
      }

      // Handle deprecated status
      if (!options.includeDeprecated) {
        query['stix.x_mitre_deprecated'] = { $in: [null, false] };
      }

      // Handle workflow state
      if (typeof options.state !== 'undefined') {
        query['workspace.workflow.state'] = Array.isArray(options.state)
          ? { $in: options.state }
          : options.state;
      }

      // Build aggregation pipeline
      // Note: This matches the original stix-bundles-service.js logic
      const aggregation = [
        // Sort by STIX ID and modified date to get latest versions
        { $sort: { 'stix.id': 1, 'stix.modified': -1 } },

        // Group by STIX ID to get latest version of each matrix
        { $group: { _id: '$stix.id', document: { $first: '$$ROOT' } } },

        // Restore the full document structure
        { $replaceRoot: { newRoot: '$document' } },

        // Final sort by STIX ID
        { $sort: { 'stix.id': 1 } },

        // Apply our filters (excluding domain)
        { $match: query },
      ];

      const results = await this.model.aggregate(aggregation).exec();
      return results;
    } catch (err) {
      throw new DatabaseError(err);
    }
  }
}

module.exports = new MatrixRepository(Matrix);
