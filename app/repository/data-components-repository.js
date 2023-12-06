'use strict';

const BaseRepository = require('./_base.repository');
const DataComponent = require('../models/data-component-model');

class DataComponentsRepository extends BaseRepository {

}

module.exports = new DataComponentsRepository(DataComponent);