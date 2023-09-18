'use strict';

const BaseRepository = require('./_repository.base');
const Matrix = require('../models/matrix-model');

/**
 * If a function is not directly found on the exports object in _repository.base.js, 
 * JavaScript will look up its prototype chain to find it. If it exists on the BaseRepository, 
 * it will use that. This effectively allows the concrete repository to "inherit" methods 
 * from the base repository.
 */
Object.setPrototypeOf(exports, BaseRepository);

/**
 * @description Retrieves documents based on the provided options, filtering on revoked, deprecated states, etc. The response is aggregated based on 'stix.id' and then filtered according to options like search, offset, and limit.
 * @param {*} options Options object containing various filters and parameters for the search.
 * @returns {Array} Array of aggregated documents.
 */
exports.retrieveAll = function (options) {
    return BaseRepository.retrieveAll(Matrix, options);
};

/**
 * @description Retrieves a single document from the Matrix collection based on a given stixId.
 * @param {*} stixId The STIX identifier of the desired document.
 * @returns {Object} The document associated with the provided stixId.
 */
exports.retrieveOneById = function (stixId) {
    return BaseRepository.retrieveOneById(Matrix, stixId);
};

/**
 * @description Retrieves all versions of a document from the Matrix collection based on a given stixId.
 * @param {*} stixId The STIX identifier of the desired documents.
 * @returns {Array} Array of documents associated with the provided stixId.
 */
exports.retrieveAllById = function (stixId) {
    return BaseRepository.retrieveAllById(Matrix, stixId);
};

/**
 * @description Retrieves the latest version of a document from the Matrix collection based on a given stixId.
 * @param {*} stixId The STIX identifier of the desired document.
 * @returns {Object} The latest version of the document associated with the provided stixId.
 */
exports.retrieveLatestByStixId = function (stixId) {
    return BaseRepository.retrieveLatestByStixId(Matrix, stixId);
};

/**
 * @description Retrieves a specific version of a document from the Matrix collection based on a given stixId and modification timestamp.
 * @param {*} stixId The STIX identifier of the desired document.
 * @param {*} modified The modification timestamp of the desired version.
 * @returns {Object} The specific version of the document associated with the provided stixId and modified timestamp.
 */
exports.retrieveOneByVersion = function (stixId, modified) {
    return BaseRepository.retrieveOneByVersion(Matrix, stixId, modified);
};

/**
 * @description Saves a new matrix data document to the Matrix collection.
 * @param {*} matrixData Data to be saved to the Matrix collection.
 * @returns {Object} The saved matrix data document.
 */
exports.saveMatrix = function (matrixData) {
    return BaseRepository.save(Matrix, matrixData);
};


// exports.updateAndSave = async function (document, data) {
//     This is implemented by the BaseRepository already!!! 
// };


/**
 * @description Finds a specific version of a document based on a given stixId and modification timestamp, and then removes it from the Matrix collection.
 * @param {*} stixId The STIX identifier of the desired document.
 * @param {*} modified The modification timestamp of the desired version.
 * @returns {Object} Details of the removal operation.
 */
exports.findOneAndRemove = function (model, stixId, modified) {
    return BaseRepository.findOneAndRemove(model, stixId, modified);
};

/**
 * @description Removes all versions of a document from the Matrix collection based on a given stixId.
 * @param {*} stixId The STIX identifier of the documents to be removed.
 * @returns {Object} Details of the removal operation.
 */
exports.deleteMany = function (model, stixId) {
    return BaseRepository.deleteMany(model, stixId);
};