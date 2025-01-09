'use strict';

const BaseRepository = require('./_base.repository');
const MarkingDefinition = require('../models/marking-definition-model');
const { DatabaseError } = require('../exceptions');

class MarkingDefinitionsRepository extends BaseRepository {
  async deleteOneById(stixId) {
    try {
      return await this.model.findOneAndDelete({ 'stix.id': stixId }).exec();
    } catch (err) {
      throw new DatabaseError(err);
    }
  }
}

module.exports = new MarkingDefinitionsRepository(MarkingDefinition);
