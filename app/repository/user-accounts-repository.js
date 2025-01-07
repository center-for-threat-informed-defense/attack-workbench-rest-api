'use strict';

const UserAccount = require('../models/user-account-model');
const { DatabaseError, DuplicateIdError } = require('../exceptions');
const regexValidator = require('../lib/regex');
const { BadlyFormattedParameterError } = require('../exceptions');

class UserAccountsRepository {
  constructor(model) {
    this.model = model;
  }

  async retrieveAll(options) {
    try {
      // Build the query
      const query = {};
      if (typeof options.status !== 'undefined') {
        if (Array.isArray(options.status)) {
          query['status'] = { $in: options.status };
        } else {
          query['status'] = options.status;
        }
      }

      if (typeof options.role !== 'undefined') {
        if (Array.isArray(options.role)) {
          query['role'] = { $in: options.role };
        } else {
          query['role'] = options.role;
        }
      }

      // Build the aggregation
      // - Then apply query, skip, and limit options
      const aggregation = [{ $sort: { username: 1 } }, { $match: query }];

      if (typeof options.search !== 'undefined') {
        options.search = regexValidator.sanitizeRegex(options.search);
        const match = {
          $match: {
            $or: [
              { username: { $regex: options.search, $options: 'i' } },
              { email: { $regex: options.search, $options: 'i' } },
              { displayName: { $regex: options.search, $options: 'i' } },
            ],
          },
        };
        aggregation.push(match);
      }

      const facet = {
        $facet: {
          totalCount: [{ $count: 'totalCount' }],
          documents: [],
        },
      };

      if (options.offset) {
        facet.$facet.documents.push({ $skip: options.offset });
      } else {
        facet.$facet.documents.push({ $skip: 0 });
      }

      if (options.limit) {
        facet.$facet.documents.push({ $limit: options.limit });
      }

      aggregation.push(facet);

      // Retrieve the documents
      return await this.model.aggregate(aggregation).exec();
    } catch (err) {
      throw new DatabaseError(err);
    }
  }

  async retrieveOneById(stixId) {
    try {
      return await this.model.findOne({ id: stixId }).lean().exec();
    } catch (err) {
      throw new DatabaseError(err);
    }
  }

  createNewDocument(data) {
    return new this.model(data);
  }

  // eslint-disable-next-line class-methods-use-this
  async saveDocument(document) {
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

  // eslint-disable-next-line class-methods-use-this
  async save(data) {
    try {
      const document = new this.model(data);
      return await document.save();
    } catch (err) {
      if (err.name === 'MongoServerError' && err.code === 11000) {
        throw new DuplicateIdError({
          details: `Document with id '${data.id}' already exists.`,
        });
      }
      throw new DatabaseError(err);
    }
  }

  async findOneAndRemove(stixId) {
    try {
      return await this.model.findOneAndRemove({ id: stixId }).exec();
    } catch (err) {
      throw new DatabaseError(err);
    }
  }

  async retrieveOneByEmail(email) {
    try {
      return await this.model.findOne({ email: email }).lean().exec();
    } catch (err) {
      throw new DatabaseError(err);
    }
  }

  async retrieveOneByUserAccountId(userAccountId) {
    try {
      return await this.model.findOne({ id: userAccountId }).exec();
    } catch (err) {
      throw new DatabaseError(err);
    }
  }

  async updateById(userAccountId, data) {
    try {
      const document = await this.retrieveOneByUserAccountId(userAccountId);

      if (!document) {
        // document not found
        return null;
      }

      // Copy data to found document
      document.email = data.email;
      document.username = data.username;
      document.displayName = data.displayName;
      document.status = data.status;
      document.role = data.role;

      // Set the modified timestamp
      document.modified = new Date().toISOString();

      // Save and return the document
      try {
        return await document.save();
      } catch (err) {
        if (err.name === 'MongoServerError' && err.code === 11000) {
          throw new DuplicateIdError({
            details: `Document with id '${data.stix.id}' already exists.`,
          });
        }
        throw new DatabaseError(err);
      }
    } catch (err) {
      if (err.name === 'CastError') {
        throw new BadlyFormattedParameterError('userId');
      } else {
        throw err;
      }
    }
  }
}

module.exports = new UserAccountsRepository(UserAccount);
