'use strict';

const mongoose = require('mongoose');
const AttackObject = require('./attack-object-model');
const stixCoreDefinitions = require('./subschemas/stix-core');
const { ModelName } = require('../lib/model-names');

const relatedAsset = {
  name: { type: String, required: true },
  related_asset_sectors: { type: [String], default: undefined },
  description: String,
};
const relatedAssetSchema = new mongoose.Schema(relatedAsset, { _id: false });

const stixAsset = {
  // STIX asset specific properties
  modified: { type: Date, required: true },
  name: { type: String, required: true },
  description: String,

  // ATT&CK custom stix properties
  x_mitre_sectors: { type: [String], default: undefined },
  x_mitre_related_assets: { type: [relatedAssetSchema], default: undefined },
  x_mitre_modified_by_ref: String,
  x_mitre_platforms: { type: [String], default: undefined },
  x_mitre_deprecated: { type: Boolean, required: true, default: false },
  x_mitre_domains: { type: [String], default: undefined },
  x_mitre_version: String,
  x_mitre_attack_spec_version: String,
  x_mitre_contributors: { type: [String], default: undefined },
};

// Create the definition
const assetDefinition = {
  stix: {
    ...stixCoreDefinitions.commonRequiredSDO,
    ...stixCoreDefinitions.commonOptionalSDO,
    ...stixAsset,
  },
};

// Create the schema
const assetSchema = new mongoose.Schema(assetDefinition);

// Create the model
const AssetModel = AttackObject.discriminator(ModelName.Asset, assetSchema);

module.exports = AssetModel;
