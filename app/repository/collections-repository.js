'use strict';

const BaseRepository = require('./_base.repository');
const Collection = require('../models/collection-model');

class CollectionsRepository extends BaseRepository {

    constructor() {
        super(Collection);
    }
}

module.exports = new CollectionsRepository();