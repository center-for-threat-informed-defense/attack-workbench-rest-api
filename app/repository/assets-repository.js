'use strict';

const BaseRepository = require('./_base.repository');
const Asset = require('../models/asset-model');

class AssetsRepository extends BaseRepository {}

module.exports = new AssetsRepository(Asset);