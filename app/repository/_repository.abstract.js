/* eslint-disable require-await */
'use strict';

const { NotImplementedError } = require('../exceptions');

/**
 * @description Retrieves documents based on the provided options.
 * @param {*} options Options object containing various filters and parameters for the search.
 * @returns {Array} Array of aggregated documents.
 */
exports.retrieveAll = async function (options) {
    throw new NotImplementedError(module.filename, 'retrieveAll');
};

/**
 * @description Retrieves a document by its stixId.
 * @param {*} stixId The unique identifier for the document.
 * @returns {Object} The retrieved document.
 */
exports.retrieveOneById = async function (stixId) {
    throw new NotImplementedError(module.filename, 'retrieveOneById');
};

/**
 * @description Retrieves all documents by a specific stixId.
 * @param {*} stixId The unique identifier for the documents.
 * @returns {Array} Array of aggregated documents.
 */
exports.retrieveAllById = async function (stixId) {
    throw new NotImplementedError(module.filename, 'retrieveAllById');
};

/**
 * @description Retrieves the latest document by its stixId.
 * @param {*} stixId The unique identifier for the document.
 * @returns {Object} The retrieved document.
 */
exports.retrieveLatestByStixId = async function (stixId) {
    throw new NotImplementedError(module.filename, 'retrieveLatestByStixId');
};

/**
 * @description Retrieves a document by its stixId and modification date.
 * @param {*} stixId The unique identifier for the document.
 * @param {*} modified The modification date for the document.
 * @returns {Object} The retrieved document.
 */
exports.retrieveOneByVersion = async function (stixId, modified) {
    throw new NotImplementedError(module.filename, 'retrieveOneByVersion');
};

/**
 * @description Saves the provided data.
 * @param {*} data The data to be saved.
 * @returns {Object} The saved document.
 */
exports.save = async function (data) {
    throw new NotImplementedError(module.filename, 'save');
};

/**
 * @description Updates and saves the provided document.
 * @param {*} document The document to be updated.
 * @param {*} data The data for updating the document.
 * @returns {Object} The updated and saved document.
 */
exports.updateAndSave = async function (document, data) {
    throw new NotImplementedError(module.filename, 'updateAndSave');
};

/**
 * @description Retrieves and removes a document by its stixId and modification date.
 * @param {*} stixId The unique identifier for the document.
 * @param {*} modified The modification date for the document.
 * @returns {Object} The removed document.
 */
exports.findOneAndRemove = async function (stixId, modified) {
    throw new NotImplementedError(module.filename, 'findOneAndRemove');
};

/**
 * @description Deletes many documents by a specific stixId.
 * @param {*} stixId The unique identifier for the documents.
 */
exports.deleteMany = async function (stixId) {
    throw new NotImplementedError(module.filename, 'deleteMany');
};