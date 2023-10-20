'use strict';

const Campaign = require('../models/campaign-model');
const {lastUpdatedByQueryHelper} = require('../lib/request-parameter-helper');

const campaignsRepository = require('../repository/campaigns-repository');

const BaseService = require('./_base.service');

class CampaignService extends BaseService {

    constructor() {
        super(campaignsRepository, Campaign);

    }

}

module.exports = new CampaignService();