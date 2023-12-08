'use strict';

const BaseRepository = require('./_base.repository');
const Collection = require('../models/collection-model');

class CollectionsRepository extends BaseRepository {
}

module.exports = new CollectionsRepository(Collection);