'use strict';

const mongoose = require('mongoose');
const AttackObject = require('./attack-object-model');

const markingObject = {
    statement: String
};

// TBD: Marking Definition should not have modified or revoked properties.

const markingDefinitionProperties = {
    // marking definition specific properties
    name: { type: String, required: true },
    definition_type: String,
    definition: markingObject
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
const MarkingDefinitionModel = AttackObject.discriminator('MarkingDefinitionModel', markingDefinitionSchema);

module.exports = MarkingDefinitionModel;
