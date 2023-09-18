'use strict';

const { NotImplementedError } = require('../exceptions');

exports.retrieveAll = function (repository, options) {
    throw NotImplementedError(module.filename, 'retrieveAll');
};

exports.retrieveById = function (repository, stixId, options) {
    throw NotImplementedError(module.filename, 'retrieveById');
};

exports.retrieveVersionById = function (repository, stixId, modified) {
    throw NotImplementedError(module.filename, 'retrieveVersionById');
};

exports.create = function (repository, model, data, options) {
    throw NotImplementedError(module.filename, 'create');
};