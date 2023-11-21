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

    async updateFull(stixId, data) {
        if (!stixId) {
            throw new MissingParameterError;
        }

        if (data?.workspace?.workflow?.state === 'static') {
            throw new Error(errors.cannotUpdateStaticObject);
        }

        MarkingDefinition.findOne({ 'stix.id': stixId }, function(err, document) {
            if (err) {
                if (err.name === 'CastError') {
                    throw new BadlyFormattedParameterError;
                }
                else {
                    throw err;
                }
            }
            else if (!document) {
                // document not found
                return null;
            }
            else {
                // Copy data to found document and save
                Object.assign(document, data);

                try {
                    const savedDocument = document.save();
                    return savedDocument;
                } catch (err) {
                    if (err.name === 'MongoServerError' && err.code === 11000) {
                        throw new DuplicateIdError
                    }
                    else {
                        throw err;
                    }
                }
                }
        });
    };

    async delete(stixId, callback) {
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

module.exports = new MarkingDefinitionsService('x-mitre-marking-definition', MarkingDefinitionRepository);
