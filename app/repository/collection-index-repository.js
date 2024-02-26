const CollectionIndex = require('../models/collection-index-model');
class CollectionIndexRepository {

    constructor(model) {
        this.model = model;
    }

}
module.exports = CollectionIndexRepository(CollectionIndex);
