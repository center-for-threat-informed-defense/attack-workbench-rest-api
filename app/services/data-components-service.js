'use strict';

const dataComponentsRepository = require('../repository/data-components-repository.js');

const BaseService = require('./_base.service');

class DataComponentsService extends BaseService { }

module.exports = new DataComponentsService('x-mitre-data-component', dataComponentsRepository);
