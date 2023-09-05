/* eslint-disable require-await */
'use strict';

/**
 * @description Retrieves documents based on the provided options.
 * @param {*} options Options object containing various filters and parameters for the search.
 * @returns {Array} Array of aggregated documents.
 */
exports.findAll = async function (options) {
    throw new Error('Function "findAll" must be implemented.');
};

/**
 * @description Retrieves a document by its stixId.
 * @param {*} stixId The unique identifier for the document.
 * @returns {Object} The retrieved document.
 */
exports.findOneById = async function (stixId) {
    throw new Error('Function "findOneById" must be implemented.');
};

/**
 * @description Retrieves all documents by a specific stixId.
 * @param {*} stixId The unique identifier for the documents.
 * @returns {Array} Array of aggregated documents.
 */
exports.findAllById = async function (stixId) {
    throw new Error('Function "findAllById" must be implemented.');
};

/**
 * @description Retrieves the latest document by its stixId.
 * @param {*} stixId The unique identifier for the document.
 * @returns {Object} The retrieved document.
 */
exports.findLatestByStixId = async function (stixId) {
    throw new Error('Function "findLatestByStixId" must be implemented.');
};

/**
 * @description Retrieves a document by its stixId and modification date.
 * @param {*} stixId The unique identifier for the document.
 * @param {*} modified The modification date for the document.
 * @returns {Object} The retrieved document.
 */
exports.findOneByVersion = async function (stixId, modified) {
    throw new Error('Function "findOneByVersion" must be implemented.');
};

/**
 * @description Saves the provided data.
 * @param {*} data The data to be saved.
 * @returns {Object} The saved document.
 */
exports.save = async function (data) {
    throw new Error('Function "save" must be implemented.');
};

/**
 * @description Updates and saves the provided document.
 * @param {*} document The document to be updated.
 * @param {*} data The data for updating the document.
 * @returns {Object} The updated and saved document.
 */
exports.updateAndSave = async function (document, data) {
    throw new Error('Function "updateAndSave" must be implemented.');
};

/**
 * @description Retrieves and removes a document by its stixId and modification date.
 * @param {*} stixId The unique identifier for the document.
 * @param {*} modified The modification date for the document.
 * @returns {Object} The removed document.
 */
exports.findOneAndRemove = async function (stixId, modified) {
    throw new Error('Function "findOneAndRemove" must be implemented.');
};

/**
 * @description Deletes many documents by a specific stixId.
 * @param {*} stixId The unique identifier for the documents.
 */
exports.deleteMany = async function (stixId) {
    throw new Error('Function "deleteMany" must be implemented.');
};
