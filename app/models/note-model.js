'use strict';

const mongoose = require('mongoose');
const AttackObject = require('./attack-object-model');
const stixCoreDefinitions = require('./subschemas/stix-core');
const { ModelName } = require('../lib/model-names');

const noteProperties = {
  // note specific properties
  modified: { type: Date, required: true },
  abstract: String,
  content: { type: String, required: true },
  authors: [String],
  object_refs: { type: [String], required: true },

  // ATT&CK custom stix properties
  x_mitre_modified_by_ref: String,
  x_mitre_deprecated: { type: Boolean, required: true, default: false },
  x_mitre_attack_spec_version: String,
};

// Create the definition
const noteDefinition = {
  stix: {
    ...stixCoreDefinitions.commonRequiredSDO,
    ...stixCoreDefinitions.commonOptionalSDO,
    ...noteProperties,
  },
};

// Create the schema
const noteSchema = new mongoose.Schema(noteDefinition);

// Create the model
const NoteModel = AttackObject.discriminator(ModelName.Note, noteSchema);

module.exports = NoteModel;
