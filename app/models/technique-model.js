'use strict';

const mongoose = require('mongoose');
const attackCoreDefinitions = require('./subschemas/attack-core-definitions');
const stixAttackPatternDefinitions = require('./subschemas/stix-attack-pattern-definitions')

// Create the definition
const techniqueDefinition = {
    _id: { type: String },

    // ATT&CK workspace properties
    domains: [ String ],
    editor_identity: { type: attackCoreDefinitions.editorIdentity},

    stix: {
        ...stixAttackPatternDefinitions.attackPattern,
    }
};

// Create the schema
const techniqueSchema = new mongoose.Schema(techniqueDefinition);

// Create the model
const TechniqueModel = mongoose.model('Technique', techniqueSchema);

module.exports = TechniqueModel;
