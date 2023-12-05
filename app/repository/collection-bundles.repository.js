const BaseRepository = require("./_base.repository");

const Collection = require('../models/collection-model');

class CollectionBundlesRepository extends BaseRepository { }

module.exports = new CollectionBundlesRepository(Collection);