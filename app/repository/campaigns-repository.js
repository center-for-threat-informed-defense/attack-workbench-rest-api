'use strict';

const BaseRepository = require('./_base.repository');
const Campaign = require('../models/campaign-model');

class CampaignRepository extends BaseRepository {

    constructor() {
        super(Campaign);
    }
}

module.exports = new CampaignRepository();