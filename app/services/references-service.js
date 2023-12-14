'use strict';

const ReferenceRepository = require('../repository/references-repository');

class ReferencesService {

    constructor() {
        this.repository = ReferenceRepository;
    }

    async retrieveAll(options) {
        return this.repository.retrieveAll(options);
    }
    
    async create(data) {
        return this.repository.create(data);
    }
    
    async update(data) {
        return this.repository.update(data);
    }

    async deleteBySourceName(sourceName) {
        return this.repository.deleteBySourceName(sourceName);
    }

}

module.exports = new ReferencesService(ReferenceRepository);