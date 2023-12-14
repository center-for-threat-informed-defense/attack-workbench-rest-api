'use strict';

const ReferenceRepository = require('../repository/references-repository');

class ReferencesService {

    constructor() {
        this.repository = ReferenceRepository;
    }

    async retrieveAll(options) {
        const res = await this.repository.retrieveAll(options);
        return res;
    }
    
    async create(data) {
        const res = await this.repository.create(data);
        return res;
    }
    
    async update(data) {
        const res = await this.repository.update(data);
        return res;
    }

    async deleteBySourceName(sourceName) {
        const res = await this.repository.deleteBySourceName(sourceName);
        return res;
    }

}

module.exports = new ReferencesService(ReferenceRepository);