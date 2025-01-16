'use strict';

const BaseRepository = require('./_base.repository');
const Collection = require('../models/collection-model');
const AttackObject = require('../models/attack-object-model');
const regexValidator = require('../lib/regex');
const { lastUpdatedByQueryHelper } = require('../lib/request-parameter-helper');
const {
  DatabaseError,
  BadlyFormattedParameterError,
  DuplicateIdError,
} = require('../exceptions');

class CollectionRepository extends BaseRepository {
  constructor(model, attackObjectModel) {
    super(model);
    this._attackObjectModel = attackObjectModel;
  }

  // A lean variant of BaseService.retrieveOneById
  // TODO merge the two methods by supporting method argument 'lean=false' that toggles .lean() on/off
  // TODO change function name to reflect that it returns an array, or fix the calling function
  async retrieveOneByIdLean(stixId) {
    try {
      return await this.model.find({ 'stix.id': stixId }).lean().exec();
    } catch (err) {
      throw new DatabaseError(err);
    }
  }

  // A lean variant of BaseService.retrieveOneByVersion
  // TODO merge the two methods by supporting method argument 'lean=false' that toggles .lean() on/off
  async retrieveOneByVersionLean(stixId, modified) {
    try {
      return await this.model
        .findOne({ 'stix.id': stixId, 'stix.modified': modified })
        .lean()
        .exec();
    } catch (err) {
      if (err.name === 'CastError') {
        throw new BadlyFormattedParameterError({ parameterName: 'stixId' });
      } else if (err.name === 'MongoServerError' && err.code === 11000) {
        throw new DuplicateIdError();
      }
      throw new DatabaseError(err);
    }
  }

  // A temporary fix for a query in CollectionService::deleteAllContentsOfCollection
  // TODO refactor the service to bring the query logic in here.
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

      // Get the total count of documents, pre-limit
      const totalCount = await this.model.aggregate(aggregation).count('totalCount').exec();

      if (options.skip) {
        aggregation.push({ $skip: options.skip });
      }
      if (options.limit) {
        aggregation.push({ $limit: options.limit });
      }

      // Retrieve the documents
      const documents = await this.model.aggregate(aggregation).exec();

      // Return data in the format previously given by $facet
      return [
        {
          totalCount: [{ totalCount: totalCount[0]?.totalCount || 0 }],
          documents: documents,
        },
      ];
    } catch (err) {
      throw new DatabaseError(err);
    }
  }

  async insertExport(stixId, modified, exportData) {
    try {
      const collection = await this.model.findOne({
        'stix.id': stixId,
        'stix.modified': modified,
      });

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
      let dbQuery = this._attackObjectModel.findOne(query);

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
      return await this._attackObjectModel.findByIdAndDelete(id);
    } catch (err) {
      throw new DatabaseError(err);
    }
  }

  async updateAttackObject(id, update) {
    try {
      return await this._attackObjectModel.findByIdAndUpdate(id, update);
    } catch (err) {
      throw new DatabaseError(err);
    }
  }
}

module.exports = new CollectionRepository(Collection, AttackObject);
