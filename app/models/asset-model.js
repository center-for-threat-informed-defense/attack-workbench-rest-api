'use strict';

const mongoose = require('mongoose');
const AttackObject = require('./attack-object-model');

const relatedAsset = {
    name: { type: String, required: true },
    related_asset_sectors : [ String ],
    description: String,
};
const relatedAssetSchema = new mongoose.Schema(relatedAsset, { _id: false });

const stixAsset = {
    // STIX asset specific properties
    modified: { type: Date, required: true },
    name: { type: String, required: true },
    description: String,

    // ATT&CK custom stix properties
    x_mitre_sectors: [ String ],
    x_mitre_related_assets: [ relatedAssetSchema ],
    x_mitre_modified_by_ref: String,
    x_mitre_platforms: [ String ],
    x_mitre_deprecated: Boolean,
    x_mitre_domains: [ String ],
    x_mitre_version: String,
    x_mitre_attack_spec_version: String,
    x_mitre_contributors: [ String ],
};

// Create the definition
const assetDefinition = {
    stix: {
        ...stixAsset
    }
};

// Create the schema
const assetSchema = new mongoose.Schema(assetDefinition);

// Create the model
const AssetModel = AttackObject.discriminator('Asset', assetSchema);

module.exports = AssetModel;
