'use strict';

const mongoose = require('mongoose');
const AttackObject = require('./attack-object-model');

const matrixProperties = {
    // x-mitre-matrix specific properties
    modified: { type: Date, required: true },
    name: { type: String, required: true },
    description: String,

    // ATT&CK custom stix properties
    tactic_refs: [ String ],
    x_mitre_deprecated: Boolean,
    x_mitre_domains: [ String ],
    x_mitre_version: String
};

// Create the definition
const matrixDefinition = {
    stix: {
        ...matrixProperties
    }
};

// Create the schema
const matrixSchema = new mongoose.Schema(matrixDefinition);

// Create the model
const MatrixModel = AttackObject.discriminator('MatrixModel', matrixSchema);

module.exports = MatrixModel;
