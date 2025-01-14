'use strict';

const BaseRepository = require('./_base.repository');
const Collection = require('../models/collection-model');
const regexValidator = require('../lib/regex');
const { lastUpdatedByQueryHelper } = require('../lib/request-parameter-helper');
const { DatabaseError } = require('../exceptions');

class CollectionRepository extends BaseRepository {
  async findWithContents(query, options = {}) {
    try {
      let dbQuery = Collection.find(query);

      if (options.sort) {
        dbQuery = dbQuery.sort(options.sort);
      }

      if (options.lean) {
        dbQuery = dbQuery.lean();
      }

      return await dbQuery.exec();
    } catch (err) {
      throw new DatabaseError(err);
    }
  }

  async findOneWithContents(query, options = {}) {
    try {
      let dbQuery = Collection.findOne(query);

      if (options.sort) {
        dbQuery = dbQuery.sort(options.sort);
      }

      if (options.lean) {
        dbQuery = dbQuery.lean();
      }

      return await dbQuery.exec();
    } catch (err) {
      throw new DatabaseError(err);
    }
  }

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
      if (typeof options.lastUpdatedBy !== 'undefined') {
        query['workspace.workflow.created_by_user_account'] = lastUpdatedByQueryHelper(
          options.lastUpdatedBy,
        );
      }

      // Build the aggregation
      const aggregation = [{ $sort: { 'stix.id': 1, 'stix.modified': -1 } }];
      if (options.versions === 'latest') {
        aggregation.push({ $group: { _id: '$stix.id', document: { $first: '$$ROOT' } } });
        aggregation.push({ $replaceRoot: { newRoot: '$document' } });
        aggregation.push({ $sort: { 'stix.id': 1 } });
      }

      // Apply query, skip and limit options
      aggregation.push({ $match: query });

      if (typeof options.search !== 'undefined') {
        options.search = regexValidator.sanitizeRegex(options.search);
        const match = {
          $match: {
            $or: [
              { 'stix.name': { $regex: options.search, $options: 'i' } },
              { 'stix.description': { $regex: options.search, $options: 'i' } },
            ],
          },
        };
        aggregation.push(match);
      }

      if (options.skip) {
        aggregation.push({ $skip: options.skip });
      }
      if (options.limit) {
        aggregation.push({ $limit: options.limit });
      }

      return await Collection.aggregate(aggregation);
    } catch (err) {
      throw new DatabaseError(err);
    }
  }

  async insertExport(stixId, modified, exportData) {
    try {
      const collection = await Collection.findOne({ 'stix.id': stixId, 'stix.modified': modified });

      if (!collection) {
        throw new Error('Document not found');
      }

      if (!collection.workspace.exported) {
        collection.workspace.exported = [];
      }
      collection.workspace.exported.push(exportData);

      return await collection.save();
    } catch (err) {
      throw new DatabaseError(err);
    }
  }

  async findAttackObject(query, options = {}) {
    try {
      let dbQuery = AttackObject.findOne(query);

      if (options.lean) {
        dbQuery = dbQuery.lean();
      }

      return await dbQuery.exec();
    } catch (err) {
      throw new DatabaseError(err);
    }
  }

  async deleteAttackObjectById(id) {
    try {
      return await AttackObject.findByIdAndDelete(id);
    } catch (err) {
      throw new DatabaseError(err);
    }
  }

  async updateAttackObject(id, update) {
    try {
      return await AttackObject.findByIdAndUpdate(id, update);
    } catch (err) {
      throw new DatabaseError(err);
    }
  }
}

module.exports = new CollectionRepository(Collection);
