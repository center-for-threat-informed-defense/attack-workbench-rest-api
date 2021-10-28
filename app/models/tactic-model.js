'use strict';

const mongoose = require('mongoose');
const AttackObject = require('./attack-object-model');

const stixTactic = {
    // STIX x-mitre-tactic specific properties
    modified: { type: Date, required: true },
    name: { type: String, required: true },
    description: String,

    // ATT&CK custom stix properties
    x_mitre_modified_by_ref: String,
    x_mitre_deprecated: Boolean,
    x_mitre_domains: [ String ],
    x_mitre_version: String,
    x_mitre_attack_spec_version: String,
    x_mitre_contributors: [ String ],
    x_mitre_shortname: String
};

// Create the definition
const tacticDefinition = {
    stix: {
        ...stixTactic
    }
};

// Create the schema
const tacticSchema = new mongoose.Schema(tacticDefinition);

// Create the model
const TacticModel = AttackObject.discriminator('Tactic', tacticSchema);

module.exports = TacticModel;
