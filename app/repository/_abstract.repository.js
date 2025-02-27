'use strict';

const { NotImplementedError } = require('../exceptions');

class AbstractRepository {
  /**
   * @description Retrieves documents based on the provided options.
   * @param {*} options Options object containing various filters and parameters for the search.
   * @returns {Array} Array of aggregated documents.
   */
  // eslint-disable-next-line no-unused-vars
  async retrieveAll(options) {
    throw new NotImplementedError(this.constructor.name, 'retrieveAll');
  }

  /**
   * @description Retrieves a document by its stixId.
   * @param {*} stixId The unique identifier for the document.
   * @returns {Object} The retrieved document.
   */
  // eslint-disable-next-line no-unused-vars
  async retrieveOneByStixId(stixId) {
    throw new NotImplementedError(this.constructor.name, 'retrieveOneById');
  }

  /**
   * @description Retrieves all documents by a specific stixId.
   * @param {*} stixId The unique identifier for the documents.
   * @returns {Array} Array of aggregated documents.
   */
  // eslint-disable-next-line no-unused-vars
  async retrieveAllByStixId(stixId) {
    throw new NotImplementedError(this.constructor.name, 'retrieveAllById');
  }

  /**
   * @description Retrieves the latest document by its stixId.
   * @param {*} stixId The unique identifier for the document.
   * @returns {Object} The retrieved document.
   */
  // eslint-disable-next-line no-unused-vars
  async retrieveLatestByStixId(stixId) {
    throw new NotImplementedError(this.constructor.name, 'retrieveLatestByStixId');
  }

  /**
   * @description Retrieves a document by its stixId and modification date.
   * @param {*} stixId The unique identifier for the document.
   * @param {*} modified The modification date for the document.
   * @returns {Object} The retrieved document.
   */
  // eslint-disable-next-line no-unused-vars
  async retrieveOneByVersion(stixId, modified) {
    throw new NotImplementedError(this.constructor.name, 'retrieveOneByVersion');
  }

  /**
   * @description Saves the provided data.
   * @param {*} data The data to be saved.
   * @returns {Object} The saved document.
   */
  // eslint-disable-next-line no-unused-vars
  async save(data) {
    throw new NotImplementedError(this.constructor.name, 'save');
  }

  /**
   * @description Updates and saves the provided document.
   * @param {*} document The document to be updated.
   * @param {*} data The data for updating the document.
   * @returns {Object} The updated and saved document.
   */
  // eslint-disable-next-line no-unused-vars
  static async updateAndSave(document, data) {
    throw new NotImplementedError(this.constructor.name, 'updateAndSave');
  }

  /**
   * @description Retrieves and removes a document by its stixId and modification date.
   * @param {*} stixId The unique identifier for the document.
   * @param {*} modified The modification date for the document.
   * @returns {Object} The removed document.
   */
  // eslint-disable-next-line no-unused-vars
  async findOneAndDelete(stixId, modified) {
    throw new NotImplementedError(this.constructor.name, 'findOneAndDelete');
  }

  /**
   * @description Deletes many documents by a specific stixId.
   * @param {*} stixId The unique identifier for the documents.
   */
  // eslint-disable-next-line no-unused-vars
  async deleteMany(stixId) {
    throw new NotImplementedError(this.constructor.name, 'deleteMany');
  }
}

module.exports = AbstractRepository;
