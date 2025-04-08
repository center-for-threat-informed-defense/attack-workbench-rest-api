'use strict';

const campaignsRepository = require('../repository/campaigns-repository');
const BaseService = require('./_base.service');
const { Campaign: CampaignType } = require('../lib/types');

class CampaignService extends BaseService {}

module.exports = new CampaignService(CampaignType, campaignsRepository);
