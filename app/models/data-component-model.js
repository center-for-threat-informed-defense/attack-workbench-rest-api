'use strict';

const mongoose = require('mongoose');
const AttackObject = require('./attack-object-model');
const stixCoreDefinitions = require('./subschemas/stix-core');
const { ModelName } = require('../lib/model-names');

const logSource = {
  name: { type: String, required: true },
  channel: { type: String, required: true },
};

const logSourceSchema = new mongoose.Schema(logSource, { _id: false });

const stixDataComponent = {
  // STIX x-mitre-data-component specific properties
  modified: { type: Date, required: true },
  name: { type: String, required: true },
  description: String,

  // ATT&CK custom stix properties
  x_mitre_data_source_ref: String,
  x_mitre_modified_by_ref: String,
  x_mitre_deprecated: { type: Boolean, required: true, default: false },
  x_mitre_domains: { type: [String], default: undefined },
  x_mitre_version: String,
  x_mitre_attack_spec_version: String,
  x_mitre_log_sources: { type: [logSourceSchema], default: undefined },
};

// Create the definition
const dataComponentDefinition = {
  stix: {
    ...stixCoreDefinitions.commonRequiredSDO,
    ...stixCoreDefinitions.commonOptionalSDO,
    ...stixDataComponent,
  },
};

// Create the schema
const dataComponentSchema = new mongoose.Schema(dataComponentDefinition);

// Create the model
const DataComponentModel = AttackObject.discriminator(ModelName.DataComponent, dataComponentSchema);

module.exports = DataComponentModel;
