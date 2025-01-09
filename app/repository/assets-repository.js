'use strict';

const BaseRepository = require('./_base.repository');
const Asset = require('../models/asset-model');
const regexValidator = require('../lib/regex');
const { lastUpdatedByQueryHelper } = require('../lib/request-parameter-helper');
const { DatabaseError } = require('../exceptions');

class AssetsRepository extends BaseRepository {
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
      if (typeof options.domain !== 'undefined') {
        if (Array.isArray(options.domain)) {
          query['stix.x_mitre_domains'] = { $in: options.domain };
        } else {
          query['stix.x_mitre_domains'] = options.domain;
        }
      }
      if (typeof options.platform !== 'undefined') {
        if (Array.isArray(options.platform)) {
          query['stix.x_mitre_platforms'] = { $in: options.platform };
        } else {
          query['stix.x_mitre_platforms'] = options.platform;
        }
      }
      if (typeof options.lastUpdatedBy !== 'undefined') {
        query['workspace.workflow.created_by_user_account'] = lastUpdatedByQueryHelper(
          options.lastUpdatedBy,
        );
      }

      // Build the aggregation
      // - Group the documents by stix.id, sorted by stix.modified
      // - Use the last document in each group (according to the value of stix.modified)
      // - Then apply query, skip and limit options
      const aggregation = [
        { $sort: { 'stix.id': 1, 'stix.modified': 1 } },
        { $group: { _id: '$stix.id', document: { $last: '$$ROOT' } } },
        { $replaceRoot: { newRoot: '$document' } },
        { $sort: { 'stix.id': 1 } },
        { $match: query },
      ];

      if (typeof options.search !== 'undefined') {
        options.search = regexValidator.sanitizeRegex(options.search);
        const match = {
          $match: {
            $or: [
              { 'stix.name': { $regex: options.search, $options: 'i' } },
              { 'stix.description': { $regex: options.search, $options: 'i' } },
              { 'workspace.attack_id': { $regex: options.search, $options: 'i' } },
            ],
          },
        };
        aggregation.push(match);
      }

            // Get the total count of documents, pre-limit
            const totalCount = await this.model.aggregate(aggregation).count("totalCount").exec();

            if (options.offset) {
                aggregation.push({ $skip: options.offset });
            }
            else {
                aggregation.push({ $skip: 0 });
            }

            if (options.limit) {
                aggregation.push({ $limit: options.limit });
            }

            // Retrieve the documents
            const documents = await this.model.aggregate(aggregation).exec();

            // Return data in the format previously given by $facet
            return [{
                totalCount: [{ totalCount: totalCount[0]?.totalCount || 0, }],
                documents: documents
            }]
        } catch (err) {
            throw new DatabaseError(err);
        }
    }
}

module.exports = new AssetsRepository(Asset);
