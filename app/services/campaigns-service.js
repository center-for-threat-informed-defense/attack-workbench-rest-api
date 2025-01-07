'use strict';

const campaignsRepository = require('../repository/campaigns-repository');

const BaseService = require('./_base.service');

class CampaignService extends BaseService {}

module.exports = new CampaignService('campaign', campaignsRepository);
