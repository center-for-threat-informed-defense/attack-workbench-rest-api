'use strict';

const mongoose = require('mongoose');
const AttackObject = require('./attack-object-model');
const stixCoreDefinitions = require('./subschemas/stix-core');
const { ModelName } = require('../lib/model-names');

const logSourcePermutation = {
  name: { type: String, required: true },
  channel: { type: String, required: true },
};

const logSourcePermutationSchema = new mongoose.Schema(logSourcePermutation, { _id: false });

const stixLogSource = {
  modified: { type: Date, required: true },
  name: { type: String, required: true },

  x_mitre_modified_by_ref: String,
  x_mitre_deprecated: { type: Boolean, required: true, default: false },
  x_mitre_version: String,
  x_mitre_attack_spec_version: String,
  x_mitre_log_source_permutations: [logSourcePermutationSchema],
};

// Create the definition
const logSourceDefinition = {
  stix: {
    ...stixCoreDefinitions.commonRequiredSDO,
    ...stixCoreDefinitions.commonOptionalSDO,
    ...stixLogSource,
  },
};

// Create the schema
const logSourceSchema = new mongoose.Schema(logSourceDefinition);

// Create the model
const LogSourceModel = AttackObject.discriminator(ModelName.LogSource, logSourceSchema);

module.exports = LogSourceModel;
