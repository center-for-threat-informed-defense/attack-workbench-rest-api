'use strict';

const mongoose = require('mongoose');
const AttackObject = require('./attack-object-model');

const stixIntrusionSet = {
    // STIX intrusion-set specific properties
    modified: { type: Date, required: true },
    name: { type: String, required: true },
    description: String,

    // ATT&CK custom stix properties
    aliases: [ String ],
    x_mitre_modified_by_ref: String,
    x_mitre_deprecated: Boolean,
    x_mitre_domains: [ String ], // TBD drop this property
    x_mitre_version: String,
    x_mitre_attack_spec_version: String,
    x_mitre_contributors: [ String ]
};

// Create the definition
const groupDefinition = {
    stix: {
        ...stixIntrusionSet
    }
};

// Create the schema
const groupSchema = new mongoose.Schema(groupDefinition);

// Create the model
const GroupModel = AttackObject.discriminator('Intrusion-Set', groupSchema);

module.exports = GroupModel;
