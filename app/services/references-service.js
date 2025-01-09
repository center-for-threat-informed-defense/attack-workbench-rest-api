'use strict';

const BaseService = require('./_base.service');
const referencesRepository = require('../repository/references-repository');
const { MissingParameterError } = require('../exceptions');

class ReferencesService {
  constructor(repository) {
    this.repository = repository;
  }

  async retrieveAll(options) {
    const results = await this.repository.retrieveAll(options);
    const paginatedResults = BaseService.paginate(options, results);

    return paginatedResults;
  }

  async create(data) {
    return await this.repository.save(data);
  }

  async update(data) {
    // Note: source_name is used as the key and cannot be updated
    if (!data.source_name) {
      throw new MissingParameterError({ parameterName: 'source_name' });
    }

    return await this.repository.updateAndSave(data);
  }

  async deleteBySourceName(sourceName) {
    if (!sourceName) {
      throw new MissingParameterError({ parameterName: 'source_name' });
    }

    return await this.repository.findOneAndRemove(sourceName);
  }
}

module.exports = new ReferencesService(referencesRepository);
