'use strict';

const Reference = require('../models/reference-model');

const ReferenceRepository = require('../repository/references-repository');

const BaseService = require('./_base.service');
const { DuplicateIdError, BadlyFormattedParameterError, InvalidQueryStringParameterError } = require('../exceptions');

class ReferencesService extends BaseService {

    constructor() {
        super(ReferenceRepository, Reference);
    }

    async update(data) {
        // Note: source_name is used as the key and cannot be updated
        if (!data.source_name) {
            const error = new Error(errors.missingParameter);
            error.parameterName = 'source_name';
            throw error;
        }
    
        try {
            const document = await Reference.findOne({ 'source_name': data.source_name });
            if (!document) {
                // document not found
                return null;
            }
            else {
                // Copy data to found document and save
                Object.assign(document, data);
                const savedDocument = await document.save();
                return savedDocument;
            }
        }
        catch(err) {
            if (err.name === 'CastError') {
                throw new BadlyFormattedParameterError;
            }
            else  if (err.name === 'MongoServerError' && err.code === 11000) {
                throw new DuplicateIdError;
            } else {
                throw err;
            }
        }
    };

    async deleteBySourceName(sourceName) {
        if (!sourceName) {
            throw new MissingParameterError;
        }

        const deletedReference = await Reference.findOneAndRemove({ 'source_name': sourceName });
        return deletedReference;
    };

}

module.exports = new ReferencesService();