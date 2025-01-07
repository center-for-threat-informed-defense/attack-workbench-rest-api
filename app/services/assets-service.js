'use strict';

const assetsRepository = require('../repository/assets-repository');

const BaseService = require('./_base.service');

class AssetsService extends BaseService {}

module.exports = new AssetsService('x-mitre-asset', assetsRepository);
