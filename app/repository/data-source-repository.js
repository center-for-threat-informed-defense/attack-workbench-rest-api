'use strict';

const BaseRepository = require('./_base.repository');
const DataSource = require('../models/data-source-model');

class DataSourceRepository extends BaseRepository { }

module.exports = new DataSourceRepository(DataSource);
