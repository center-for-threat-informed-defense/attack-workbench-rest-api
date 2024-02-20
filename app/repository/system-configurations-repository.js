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
}

module.exports = new SystemConfigurationsRepository();