'use strict';

const mongoose = require('mongoose');
const AttackObject = require('./attack-object-model');
const intrusionSetDefinitions = require('./subschemas/intrusion-set');

// Create the definition
const intrusionSetDefinition = {
    stix: {
        ...intrusionSetDefinitions.intrusionSet
    }
};

// Create the schema
const intrusionSetSchema = new mongoose.Schema(intrusionSetDefinition);

// Create the model
const IntrusionSetModel = AttackObject.discriminator('Intrusion-Set', intrusionSetSchema);

module.exports = IntrusionSetModel;

