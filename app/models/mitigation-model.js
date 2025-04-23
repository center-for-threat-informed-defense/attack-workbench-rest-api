'use strict';

const mongoose = require('mongoose');
const AttackObject = require('./attack-object-model');
const stixCoreDefinitions = require('./subschemas/stix-core');
const { ModelName } = require('../lib/model-names');

const stixCourseOfAction = {
  // STIX course-of-action specific properties
  modified: { type: Date, required: true },
  name: { type: String, required: true },
  description: String,
  labels: { type: [String], default: undefined },

  // ATT&CK custom stix properties
  x_mitre_modified_by_ref: String,
  x_mitre_deprecated: { type: Boolean, required: true, default: false },
  x_mitre_domains: [String],
  x_mitre_version: String,
  x_mitre_attack_spec_version: String,
};

// Create the definition
const mitigationDefinition = {
  stix: {
    ...stixCoreDefinitions.commonRequiredSDO,
    ...stixCoreDefinitions.commonOptionalSDO,
    ...stixCourseOfAction,
  },
};

// Create the schema
const mitigationSchema = new mongoose.Schema(mitigationDefinition);

// Create the model
const MitigationModel = AttackObject.discriminator(ModelName.Mitigation, mitigationSchema);

module.exports = MitigationModel;
