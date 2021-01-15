'use strict';

const mongoose = require('mongoose');
const AttackObject = require('./attack-object-model');

const relationshipProperties = {
    // relationship specific properties
    name: { type: String, required: true },
    description: String,
    relationship_type: String,
    source_ref: String,
    target_ref: String,
    start_time: Date,
    stop_time: Date,

    // ATT&CK custom stix properties
    x_mitre_version: String
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
