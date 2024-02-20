const { DatabaseError, DuplicateIdError, BadlyFormattedParameterError } = require('../exceptions');

class SystemConfigurationsRepository { 

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
        const res = await model.findOne();
        return res;
    }

    async retrieveOneByIdLean(model) {
        const res = await model.findOne().lean();
        return res;
    }
}

module.exports = new SystemConfigurationsRepository();