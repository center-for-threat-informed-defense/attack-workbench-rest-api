const { BadlyFormattedParameterError, MissingParameterError } = require('../exceptions');
const CollectionIndex = require('../models/collection-index-model');
class CollectionIndexRepository {

    constructor(model) {
        this.model = model;
    }

    async retrieveAll(options) {
        const collectionIndexes = await this.model.find()
            .skip(options.offset)
            .limit(options.limit)
            .lean()
            .exec();

        return collectionIndexes;
    }

    async retrieveById(id) {
        try {
            if (!id) {
                throw new MissingParameterError('id');
            }
    
            const collectionIndex = await this.model.findOne({ "collection_index.id": id });
    
            return collectionIndex; // Note: collectionIndex is null if not found
        } catch (err) {
            if (err.name === 'CastError') {
                throw new BadlyFormattedParameterError;
            } else {
                throw err;
            }
        }
    }

}
module.exports = new CollectionIndexRepository(CollectionIndex);
