'use strict';

const superagent = require('superagent');

const CollectionIndexesRepository = require('../repository/collection-indexes-repository');
const BaseService = require('./_base.service');
const {
  MissingParameterError,
  NotFoundError,
  BadRequestError,
  HostNotFoundError,
  ConnectionRefusedError,
  HTTPError,
} = require('../exceptions');
const config = require('../config/config');

class CollectionIndexesService extends BaseService {
  async retrieveAll(options) {
    return await this.repository.retrieveAll(options);
  }

  async retrieveById(id) {
    return await this.repository.retrieveById(id);
  }

  async retrieveByUrl(url) {
    if (!url) {
      throw new MissingParameterError({ parameterName: 'url' });
    }

    try {
      const res = await superagent.get(url).accept('application/json');
      return JSON.parse(res.text);
    } catch (err) {
      if (err.response && err.response.notFound) {
        throw new NotFoundError(err);
      } else if (err.response && err.response.badRequest) {
        throw new BadRequestError(err);
      } else if (err.code === 'ENOTFOUND') {
        throw new HostNotFoundError(err);
      } else if (err.code === 'ECONNREFUSED') {
        throw new ConnectionRefusedError(err);
      } else {
        throw new HTTPError(err);
      }
    }
  }

  async create(data) {
    if (
      data.workspace.update_policy &&
      data.workspace.update_policy.automatic &&
      !data.workspace.update_policy.interval
    ) {
      data.workspace.update_policy.interval = config.collectionIndex.defaultInterval;
    }

    return await this.repository.save(data);
  }

  async updateFull(id, data) {
    if (!id) {
      throw new MissingParameterError({ parameterName: 'collection_index.id' });
    }

    const collectionIndex = await this.repository.retrieveById(id);

    if (!collectionIndex) return null;

    const newCollectionIndex = await this.repository.updateAndSave(collectionIndex, data);

    if (newCollectionIndex === collectionIndex) {
      return newCollectionIndex;
    } else {
      throw new DatabaseError({
        details: 'Document could not be saved',
        collectionIndex, // Pass along the document that could not be saved
      });
    }
  }

  async delete(id) {
    if (!id) {
      throw new MissingParameterError({ parameterName: 'collection_index.id' });
    }

    return await this.repository.findOneAndDelete(id);
  }

  async refresh(_id) {
    // Do nothing for now
  }
}

module.exports = new CollectionIndexesService(null, CollectionIndexesRepository);
