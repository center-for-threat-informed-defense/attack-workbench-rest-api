'use strict';

const BaseRepository = require('./_base.repository');
const DataSource = require('../models/data-source-model');

class DataSourcesRepository extends BaseRepository { }

module.exports = new DataSourcesRepository(DataSource);
