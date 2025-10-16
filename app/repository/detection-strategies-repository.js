'use strict';

const BaseRepository = require('./_base.repository');
const DetectionStrategy = require('../models/detection-strategy-model');
const regexValidator = require('../lib/regex');
const { DatabaseError } = require('../exceptions');

class DetectionStrategiesRepository extends BaseRepository {
  /**
   * Find analytic references from detection strategies that match the search term
   * @param {string} searchTerm - The search term to match against strategy names
   * @param {Object} options - Search options (includeRevoked, includeDeprecated)
   * @returns {Promise<string[]>} Array of analytic STIX IDs
   */
  async findAnalyticRefsBySearch(searchTerm, options = {}) {
    try {
      if (!searchTerm) {
        return [];
      }

      const sanitizedSearch = regexValidator.sanitizeRegex(searchTerm);

      // Build query for detection strategies matching the search term
      const query = {
        'stix.name': { $regex: sanitizedSearch, $options: 'i' },
      };

      if (!options.includeRevoked) {
        query['stix.revoked'] = { $in: [null, false] };
      }
      if (!options.includeDeprecated) {
        query['stix.x_mitre_deprecated'] = { $in: [null, false] };
      }

      const matchingStrategies = await this.model
        .find(query)
        .sort({ 'stix.id': 1, 'stix.modified': -1 })
        .exec();

      // Get latest version of each detection strategy and extract analytic refs
      const strategyGroups = {};
      matchingStrategies.forEach((strategy) => {
        const stixId = strategy.stix.id;
        if (
          !strategyGroups[stixId] ||
          strategy.stix.modified > strategyGroups[stixId].stix.modified
        ) {
          strategyGroups[stixId] = strategy;
        }
      });

      const analyticRefs = [];
      Object.values(strategyGroups).forEach((strategy) => {
        if (
          strategy.stix.x_mitre_analytic_refs &&
          Array.isArray(strategy.stix.x_mitre_analytic_refs)
        ) {
          analyticRefs.push(...strategy.stix.x_mitre_analytic_refs);
        }
      });

      return analyticRefs;
    } catch (err) {
      throw new DatabaseError(err);
    }
  }

  /**
   * Find detection strategies that reference a specific analytic
   * @param {string} analyticId - The STIX ID of the analytic
   * @param {Object} options - Query options (includeRevoked, includeDeprecated)
   * @returns {Promise<Array>} Array of detection strategy documents
   */
  async findByAnalyticRef(analyticId, options = {}) {
    try {
      if (!analyticId) {
        return [];
      }

      const query = {
        'stix.x_mitre_analytic_refs': analyticId,
      };

      if (!options.includeRevoked) {
        query['stix.revoked'] = { $in: [null, false] };
      }
      if (!options.includeDeprecated) {
        query['stix.x_mitre_deprecated'] = { $in: [null, false] };
      }

      // Get all matching detection strategies and return only the latest version of each
      const aggregation = [
        { $match: query },
        { $sort: { 'stix.id': 1, 'stix.modified': -1 } },
        { $group: { _id: '$stix.id', document: { $first: '$$ROOT' } } },
        { $replaceRoot: { newRoot: '$document' } },
        { $sort: { 'stix.id': 1 } },
      ];

      const documents = await this.model.aggregate(aggregation).exec();
      return documents;
    } catch (err) {
      throw new DatabaseError(err);
    }
  }
}

module.exports = new DetectionStrategiesRepository(DetectionStrategy);
