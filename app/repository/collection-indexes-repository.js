'use strict';

const BaseRepository = require('./_base.repository');
const CollectionIndex = require('../models/collection-index-model');
const { DatabaseError, DuplicateIdError } = require('../exceptions');

class CollectionIndexesRepository extends BaseRepository {
  async retrieveAll(options) {
    try {
      return await this.model.find().skip(options.offset).limit(options.limit).lean().exec();
    } catch (err) {
      throw new DatabaseError(err);
    }
  }

  async retrieveById(id) {
    try {
      return await this.model.findOne({ 'collection_index.id': id }).exec();
    } catch (err) {
      throw new DatabaseError(err);
    }
  }

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

  async findOneAndDelete(id) {
    try {
      return await this.model.findOneAndDelete({ 'collection_index.id': id }).exec();
    } catch (err) {
      throw new DatabaseError(err);
    }
  }
}

module.exports = new CollectionIndexesRepository(CollectionIndex);
