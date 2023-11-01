'use strict';

const BaseRepository = require('./_base.repository');
const Asset = require('../models/asset-model');

class AssetsRepository extends BaseRepository {

    constructor() {
        super(Asset);
    }
}

module.exports = new AssetsRepository();