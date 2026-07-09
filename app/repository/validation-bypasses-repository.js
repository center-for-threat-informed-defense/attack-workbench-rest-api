'use strict';

const mongoose = require('mongoose');

const ValidationBypassRule = require('../models/validation-bypass-rule-model');
const { DuplicateIdError, DatabaseError } = require('../exceptions');

class ValidationBypassesRepository {
  constructor(model) {
    this.model = model;
  }

  async retrieveAll(options) {
    const aggregation = [{ $sort: { stixType: 1 } }];

    const totalCount = await this.model.aggregate(aggregation).count('totalCount').exec();

    if (options.offset) {
      aggregation.push({ $skip: options.offset });
    } else {
      aggregation.push({ $skip: 0 });
    }

    if (options.limit) {
      aggregation.push({ $limit: options.limit });
    }

    const documents = await this.model.aggregate(aggregation).exec();

    return [
      {
        totalCount: [{ totalCount: totalCount[0]?.totalCount || 0 }],
        documents: documents,
      },
    ];
  }

  async save(data) {
    const document = new this.model(data);
    try {
      return await document.save();
    } catch (err) {
      if (err.name === 'MongoServerError' && err.code === 11000) {
        throw new DuplicateIdError({
          details:
            'A validation bypass rule with this fieldPath, errorCode, and stixType already exists.',
        });
      } else {
        throw new DatabaseError(err);
      }
    }
  }

  /**
   * Insert a rule if no rule with the same (fieldPath, errorCode, stixType)
   * key exists. Unlike save(), this does not rely on the unique index to
   * reject duplicates — on a fresh database the index may still be building
   * in the background, which would let a duplicate insert through. Used by
   * the startup seeding paths (identity/namespace/static rules), which must
   * be idempotent.
   *
   * @param {Object} data - The rule to insert
   * @returns {Promise<{created: boolean}>} created is false if the rule already existed
   */
  async upsertRule(data) {
    try {
      const existing = await this.model
        .findOneAndUpdate(
          { fieldPath: data.fieldPath, errorCode: data.errorCode, stixType: data.stixType },
          { $setOnInsert: data },
          { upsert: true, new: false, runValidators: true },
        )
        .lean()
        .exec();
      return { created: existing === null };
    } catch (err) {
      if (err.name === 'MongoServerError' && err.code === 11000) {
        // Concurrent upsert with the same key — the rule exists
        return { created: false };
      }
      throw new DatabaseError(err);
    }
  }

  async retrieveById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    try {
      return await this.model.findById(id).lean().exec();
    } catch (err) {
      throw new DatabaseError(err);
    }
  }

  async updateById(id, data) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const updateData = { ...data };
    delete updateData._id;
    delete updateData.__v;

    try {
      return await this.model
        .findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true })
        .lean()
        .exec();
    } catch (err) {
      if (err.name === 'MongoServerError' && err.code === 11000) {
        throw new DuplicateIdError({
          details:
            'A validation bypass rule with this fieldPath, errorCode, and stixType already exists.',
        });
      } else {
        throw new DatabaseError(err);
      }
    }
  }

  async deleteById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    try {
      return await this.model.findByIdAndDelete(id).exec();
    } catch (err) {
      throw new DatabaseError(err);
    }
  }

  async deleteAutoCreated() {
    try {
      return await this.model.deleteMany({ autoCreated: true }).exec();
    } catch (err) {
      throw new DatabaseError(err);
    }
  }

  async deleteByReason(reason) {
    try {
      return await this.model.deleteMany({ autoCreated: true, autoCreatedReason: reason }).exec();
    } catch (err) {
      throw new DatabaseError(err);
    }
  }

  async findAll() {
    try {
      return await this.model.find({}).lean().exec();
    } catch (err) {
      throw new DatabaseError(err);
    }
  }
}

module.exports = new ValidationBypassesRepository(ValidationBypassRule);
