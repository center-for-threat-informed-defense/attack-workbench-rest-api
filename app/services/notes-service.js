'use strict';

const notesRepository = require('../repository/notes-repository');

const BaseService = require('./_base.service');
const {
  BadlyFormattedParameterError,
  DuplicateIdError,
  MissingParameterError,
} = require('../exceptions');

class NotesService extends BaseService {
  async updateVersion(stixId, stixModified, data) {
    if (!stixId) {
      throw new MissingParameterError();
    }

    if (!stixModified) {
      throw new MissingParameterError();
    }

    try {
      const document = await this.repository.retrieveOneByVersion(stixId, stixModified);

      if (!document) {
        // document not found
        return null;
      } else {
        // Copy data to found document and save
        try {
          Object.assign(document, data);
          const savedDocument = await document.save();
          return savedDocument;
        } catch (err) {
          if (err.name === 'MongoServerError' && err.code === 11000) {
            throw new DuplicateIdError();
          } else {
            throw err;
          }
        }
      }
    } catch (err) {
      if (err.name === 'CastError') {
        throw new BadlyFormattedParameterError();
      } else {
        throw err;
      }
    }
  }
}

module.exports = new NotesService('note', notesRepository);
