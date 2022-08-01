'use strict';

const mongoose = require('mongoose');
const AttackObject = require('./attack-object-model');

const stixCampaign = {
    // STIX campaign specific properties
    modified: { type: Date, required: true },
    name: { type: String, required: true },
    description: String,
    aliases: [ String ],
    first_seen: Date,
    last_seen: Date,

    // ATT&CK custom stix properties
    x_mitre_modified_by_ref: String,
    x_mitre_deprecated: Boolean,
    x_mitre_version: String,
    x_mitre_attack_spec_version: String,
    x_mitre_contributors: [ String ]
};

// Create the definition
const campaignDefinition = {
    stix: {
        ...stixCampaign
    }
};

// Create the schema
const campaignSchema = new mongoose.Schema(campaignDefinition);

// Create the model
const CampaignModel = AttackObject.discriminator('Campaign', campaignSchema);

module.exports = CampaignModel;
