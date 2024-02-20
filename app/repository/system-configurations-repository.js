const { DatabaseError, DuplicateIdError } = require('../exceptions');
const SystemConfiguration = require('../models/system-configuration-model');

class SystemConfigurationsRepository { 

    constructor(model) {
        this.model = model;
    }

    async saveDocument(document) {
        try {
            return await document.save();
        }
        catch(err) {
            if (err.name === 'MongoServerError' && err.code === 11000) {
                throw new DuplicateIdError({
                    details: `Document with id '${ document.stix.id }' already exists.`
                });
            }
            throw new DatabaseError(err);
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