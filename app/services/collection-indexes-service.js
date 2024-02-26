'use strict';

const CollectionIndexRepository = require('../repository/collection-index-repository');

class CollectionIndexService {

    constructor(type, repository) {
        this.type = type;
        this.repository = repository;
    }

    errors = {
        badRequest: 'Bad request',
        missingParameter: 'Missing required parameter',
        badlyFormattedParameter: 'Badly formatted parameter',
        duplicateId: 'Duplicate id',
        notFound: 'Document not found',
        hostNotFound: 'Host not found',
        connectionRefused: 'Connection refused',
    };


    async retrieveAll(options) {
        return await this.repository.retrieveAll(options);
    }
    

    async retrieveById(id) {
        return await this.repository.retrieveById(id);
    }
    

    async create(data) {
        return await this.repository.create(data);
    }
    

    async updateFull(id, data) {
        return await this.repository.updateFull(id, data);
    }
    

    async delete(id) {
        return await this.repository.delete(id);
    }
    

    /**
     * Retrieves a collection index from the provided URL.
     * This is expected to be a remote URL that does not require authentication.
     */
    async retrieveByUrl(url) {
        return await this.repository.retrieveByUrl(url);
    }
    

    static async refresh(id) {
        // Do nothing for now
        await new Promise(resolve => process.nextTick(resolve));
        return {}; 
    } 

}



module.exports = new CollectionIndexService(null, CollectionIndexRepository);