'use strict';

const Reference = require('../models/reference-model');

const ReferenceRepository = require('../repository/references-repository');

const BaseService = require('./_base.service');

class ReferencesService extends BaseService {

    constructor() {
        super(ReferenceRepository, Reference);
    }

    async deleteBySourceName(sourceName) {
        if (!sourceName) {
            throw new MissingParameterError;
        }

        const deletedReference = await Reference.findOneAndRemove({ 'source_name': sourceName });
        return deletedReference;
    };

}

module.exports = new ReferencesService();