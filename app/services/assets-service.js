'use strict';

// const Asset = require('../models/asset-model');
const assetsRepository = require('../repository/assets-repository');

const BaseService = require('./_base.service');


class AssetsService extends BaseService { }

module.exports = new AssetsService(assetsRepository);