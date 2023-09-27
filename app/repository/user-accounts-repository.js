const UserAccount = require('../models/user-account-model');
const BaseRepository = require('./_base.repository');
const { DatabaseError, DuplicateIdError } = require('../exceptions');

class UserAccountsRepository extends BaseRepository {

    constructor() {
        super(UserAccount);
    }

    async retrieveOneByEmail(email) {
        try {
            return await this.model.findOne({ 'email': email }).lean().exec();
        } catch (err) {
            throw new DatabaseError(err);
        }
    }

    async updateById(userAccountId, data) {

        const document = await this.retrieveOneById(userAccountId).exec();

        if (!document) {
            // document not found
            return null;
        }

        // Copy data to found document
        document.email = data.email;
        document.username = data.username;
        document.displayName = data.displayName;
        document.status = data.status;
        document.role = data.role;

        // Set the modified timestamp
        document.modified = new Date().toISOString();

        // Save and return the document
        try {
            return await document.save();
        } catch (err) {
            if (err.name === 'MongoServerError' && err.code === 11000) {
                throw new DuplicateIdError({
                    details: `Document with id '${data.stix.id}' already exists.`
                });
            }
            throw new DatabaseError(err);
        }
    }

    async removeById(userAccountId) {
        try {
            return await this.model.findOneAndRemove({ 'id': userAccountId }).exec();
        } catch (err) {
            throw new DatabaseError(err);
        }
    }

}

module.exports = new UserAccountsRepository();