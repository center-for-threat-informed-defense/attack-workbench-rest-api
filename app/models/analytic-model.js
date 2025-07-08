'use strict';

const mongoose = require('mongoose');
const AttackObject = require('./attack-object-model');
const stixCoreDefinitions = require('./subschemas/stix-core');
const { ModelName } = require('../lib/model-names');

const logSourceReference = {
  ref: { type: String, required: true },
  key: { type: String, required: true },
};

const logSourceReferenceSchema = new mongoose.Schema(logSourceReference, { _id: false });

const mutableElement = {
  field: { type: String, required: true },
  description: { type: String, required: true },
};

const mutableElementSchema = new mongoose.Schema(mutableElement, { _id: false });

const stixAnalytic = {
  modified: { type: Date, required: true },
  description: String,
  platform: { type: String, required: true },

  x_mitre_modified_by_ref: String,
  x_mitre_deprecated: { type: Boolean, required: true, default: false },
  x_mitre_version: String,
  x_mitre_attack_spec_version: String,
  x_mitre_detects: String,
  x_mitre_log_sources: [logSourceReferenceSchema],
  x_mitre_mutable_elements: [mutableElementSchema],
};

// Create the definition
const analyticDefinition = {
  stix: {
    ...stixCoreDefinitions.commonRequiredSDO,
    ...stixCoreDefinitions.commonOptionalSDO,
    ...stixAnalytic,
  },
};

// Create the schema
const analyticSchema = new mongoose.Schema(analyticDefinition);

// Create the model
const AnalyticModel = AttackObject.discriminator(ModelName.Analytic, analyticSchema);

module.exports = AnalyticModel;
