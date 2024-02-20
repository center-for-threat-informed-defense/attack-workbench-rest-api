
const SystemConfiguration = require('../models/system-configuration-model');

class SystemConfigurationsRepository { 

    DatabaseError = require('../exceptions');
    DuplicateIdError = require('../exceptions');

    constructor(model) {
        this.model = model;
    }

    async saveDocument(document) {
        try {
            return await document.save();
        }
        catch(err) {
            if (err.name === 'MongoServerError' && err.code === 11000) {
                throw new this.DuplicateIdError({
                    details: `Document with id '${ document.stix.id }' already exists.`
                });
            }
            throw new this.DatabaseError(err);
        }
    }

    async retrieveOneById(model) {
        const res = await this.model.findOne();
        return res;
    }

    async retrieveOneByIdLean(model) {
        const res = await this.model.findOne().lean();
        return res;
    }
}

module.exports = new SystemConfigurationsRepository(SystemConfiguration);