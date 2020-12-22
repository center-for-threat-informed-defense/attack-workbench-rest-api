'use strict';

const mongoose = require('mongoose');
const AttackObject = require('./attack-object-model');
const tacticDefinitions = require('./subschemas/tactic');

// Create the definition
const tacticDefinition = {
    stix: {
        ...tacticDefinitions.tactic
    }
};

// Create the schema
const tacticSchema = new mongoose.Schema(tacticDefinition);

// Create the model
const TacticModel = AttackObject.discriminator('Tactic', tacticSchema);

module.exports = TacticModel;
