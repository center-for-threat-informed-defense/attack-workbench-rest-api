'use strict';

const assetsRepository = require('../repository/assets-repository');
const BaseService = require('./_base.service');
const { Asset: AssetType } = require('../lib/types');

class AssetsService extends BaseService {}

module.exports = new AssetsService(AssetType, assetsRepository);
