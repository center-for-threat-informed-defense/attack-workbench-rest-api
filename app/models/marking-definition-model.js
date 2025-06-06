'use strict';

const mongoose = require('mongoose');
const AttackObject = require('./attack-object-model');
const stixCoreDefinitions = require('./subschemas/stix-core');
const { ModelName } = require('../lib/model-names');

const markingObject = {
  statement: String,
  tlp: String,
};

// TBD: Marking Definition should not have modified or revoked properties.

const markingDefinitionProperties = {
  // marking definition specific properties
  name: String,
  definition_type: String,
  definition: markingObject,
};

// Create the definition
const markingDefinitionDefinition = {
  stix: {
    ...stixCoreDefinitions.commonRequiredSDO,
    ...stixCoreDefinitions.commonOptionalSDO,
    ...markingDefinitionProperties,
  },
};

// Create the schema
const markingDefinitionSchema = new mongoose.Schema(markingDefinitionDefinition);

// Create the model
const MarkingDefinitionModel = AttackObject.discriminator(
  ModelName.MarkingDefinition,
  markingDefinitionSchema,
);

module.exports = MarkingDefinitionModel;
