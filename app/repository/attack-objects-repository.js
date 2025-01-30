'use strict';

const BaseRepository = require('./_base.repository');
const AttackObject = require('../models/attack-object-model');
const { lastUpdatedByQueryHelper } = require('../lib/request-parameter-helper');
const { MissingUpdateParameterError } = require('../exceptions');
const regexValidator = require('../lib/regex');

class AttackObjectsRepository extends BaseRepository {
  async retrieveAll(options) {
    // Build the query
    const query = {};
    if (typeof options.attackId !== 'undefined') {
      if (Array.isArray(options.attackId)) {
        query['workspace.attack_id'] = { $in: options.attackId };
      } else {
        query['workspace.attack_id'] = options.attackId;
      }
    }
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
    const aggregation = [];
    if (options.versions === 'latest') {
      // - Group the documents by stix.id, sorted by stix.modified
      // - Use the first document in each group (according to the value of stix.modified)
      aggregation.push({ $sort: { 'stix.id': 1, 'stix.modified': -1 } });
      aggregation.push({ $group: { _id: '$stix.id', document: { $first: '$$ROOT' } } });
      aggregation.push({ $replaceRoot: { newRoot: '$document' } });
    }

    // - Then apply query, skip and limit options
    aggregation.push({ $sort: { 'stix.id': 1 } });
    aggregation.push({ $match: query });

    if (typeof options.search !== 'undefined') {
      options.search = regexValidator.sanitizeRegex(options.search);
      const match = {
        $match: {
          $or: [
            { 'workspace.attack_id': { $regex: options.search, $options: 'i' } },
            { 'stix.name': { $regex: options.search, $options: 'i' } },
            { 'stix.description': { $regex: options.search, $options: 'i' } },
          ],
        },
      };
      aggregation.push(match);
    }

    // Get the total count of documents, pre-limit
    const totalCount = await this.model.aggregate(aggregation).count('totalCount').exec();

    if (options.offset) {
      aggregation.push({ $skip: options.offset });
    } else {
      aggregation.push({ $skip: 0 });
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

  async findByIdAndUpdate(documentId, update) {
    try {
      if (!update) {
        throw new MissingUpdateParameterError();
      }
      return await this.model.findByIdAndUpdate(documentId, update).exec();
    } catch (error) {
      throw new DatabaseError(err);
    }
  }
}

module.exports = new AttackObjectsRepository(AttackObject);
