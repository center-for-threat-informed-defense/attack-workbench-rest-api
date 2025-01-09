'use strict';

const Team = require('../models/team-model');
const {
  BadlyFormattedParameterError,
  MissingParameterError,
  DuplicateIdError,
  DatabaseError,
  DuplicateNameError,
} = require('../exceptions');
const regexValidator = require('../lib/regex');

class TeamsRepository {
  constructor(model) {
    this.model = model;
  }

    async retrieveByUserId(userAccountId, options) {
        const aggregation = [
            { $sort: { 'name': 1 } },
            { $match: { userIDs: { $in: [userAccountId] } } }
        ];

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
    }

  async retrieveAll(options) {
    // Build the aggregation
    const aggregation = [{ $sort: { name: 1 } }];

    if (typeof options.search !== 'undefined') {
      options.search = regexValidator.sanitizeRegex(options.search);
      const match = {
        $match: {
          $or: [
            { name: { $regex: options.search, $options: 'i' } },
            { description: { $regex: options.search, $options: 'i' } },
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
    }

  async retrieveById(teamId) {
    try {
      if (!teamId) {
         throw new MissingParameterError();
      }

      const team = await this.model.findOne({ 'id': teamId }).lean().exec();

      return team;
    } catch (err) {
      if (err.name === 'CastError') {
        throw new BadlyFormattedParameterError();
      } else {
        throw err;
      }
    }
  }

  createNewDocument(data) {
    return new this.model(data);
  }

  static async saveDocument(document) {
    try {
      return await document.save();
    } catch (err) {
      if (err.name === 'MongoServerError' && err.code === 11000) {
        throw new DuplicateIdError({
          details: `Document with id '${document.id}' already exists.`,
        });
      }
      throw new DatabaseError(err);
    }
  }

  async updateFull(teamId, data) {
    try {
      if (!teamId) {
        throw new MissingParameterError();
      }

      const document = await this.model.findOne({ id: teamId });

      if (!document) {
        // Document not found
        return null;
      }

      // Copy data to found document
      document.name = data.name;
      document.description = data.description;
      document.userIDs = data.userIDs;

      // Set the modified timestamp
      document.modified = new Date().toISOString();

      // And save
      const savedDocument = await document.save();

      return savedDocument;
    } catch (err) {
      if (err.name === 'CastError') {
        throw new BadlyFormattedParameterError();
      } else if (err.name === 'MongoServerError' && err.code === 11000) {
        // 11000 = Duplicate index
        const error = err.message.includes('name_')
          ? new Error(DuplicateNameError)
          : new DuplicateIdError();
        throw error;
      } else {
        throw err;
      }
    }
  }
}

module.exports = new TeamsRepository(Team);
