'use strict';

const mongoose = require('mongoose');
const AttackObject = require('./attack-object-model');

const relationshipProperties = {
    // relationship specific properties
    modified: { type: Date, required: true },
    name: String,
    description: String,
    relationship_type: { type: String, required: true },
    source_ref: { type: String, required: true },
    target_ref: { type: String, required: true },
    start_time: Date,
    stop_time: Date,

    // ATT&CK custom stix properties
    x_mitre_modified_by_ref: String,
    x_mitre_deprecated: Boolean,
    x_mitre_domains: [ String ],
    x_mitre_version: String,
    x_mitre_attack_spec_version: String
};

// Create the definition
const relationshipDefinition = {
    stix: {
        ...relationshipProperties
    }
};

// Create the schema
const relationshipSchema = new mongoose.Schema(relationshipDefinition);

// Create the model
const RelationshipModel = AttackObject.discriminator('RelationshipModel', relationshipSchema);

module.exports = RelationshipModel;
