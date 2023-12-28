'use strict';

const uuid = require('uuid');
const MarkingDefinition = require('../models/marking-definition-model');
const systemConfigurationService = require('./system-configuration-service');
const identitiesService = require('./identities-service');
const config = require('../config/config');
const BaseService = require('./_base.service');
const MarkingDefinitionRepository = require('../repository/marking-definition-repository');
const { MissingParameterError, BadlyFormattedParameterError, DuplicateIdError } = require('../exceptions');

const errors = {
    missingParameter: 'Missing required parameter',
    badlyFormattedParameter: 'Badly formatted parameter',
    duplicateId: 'Duplicate id',
    notFound: 'Document not found',
    invalidQueryStringParameter: 'Invalid query string parameter',
    cannotUpdateStaticObject: ' Cannot update static object'
};
exports.errors = errors;

// NOTE: A marking definition does not support the modified or revoked properties!!

class MarkingDefinitionsService extends BaseService {


    async delete(stixId) {
        if (!stixId) {
            throw new MissingParameterError;
        }

        try {
            const markingDefinition = await MarkingDefinition.findOneAndRemove({ 'stix.id': stixId });
            //Note: markingDefinition is null if not found
            return markingDefinition
        } catch (err) {
            throw err;
        }

    }

}

module.exports = new MarkingDefinitionsService('marking-definition', MarkingDefinitionRepository);
