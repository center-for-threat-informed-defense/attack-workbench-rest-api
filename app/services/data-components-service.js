'use strict';

const dataComponentsRepository = require('../repository/data-components-repository.js');
const BaseService = require('./_base.service');
const { DataComponent: DataComponentType } = require('../lib/types.js');

class DataComponentsService extends BaseService {}

module.exports = new DataComponentsService(DataComponentType, dataComponentsRepository);
