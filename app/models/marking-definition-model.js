'use strict';

const mongoose = require('mongoose');
const AttackObject = require('./attack-object-model');
const { ModelName } = require('../lib/attack-prefix-ids');

const markingObject = {
    statement: String,
    tlp: String
};

// TBD: Marking Definition should not have modified or revoked properties.

const markingDefinitionProperties = {
    // marking definition specific properties
    name: String,
    definition_type: String,
    definition: markingObject,

    // ATT&CK custom stix properties
    x_mitre_deprecated: Boolean,
    x_mitre_attack_spec_version: String
};

// Create the definition
const markingDefinitionDefinition = {
    stix: {
        ...markingDefinitionProperties
    }
};

// Create the schema
const markingDefinitionSchema = new mongoose.Schema(markingDefinitionDefinition);

// Create the model
const MarkingDefinitionModel = AttackObject.discriminator(ModelName.MarkingDefinition, markingDefinitionSchema);

module.exports = MarkingDefinitionModel;
