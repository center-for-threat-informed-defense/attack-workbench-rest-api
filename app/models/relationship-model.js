'use strict';

const mongoose = require('mongoose');
const workspaceDefinitions = require('./subschemas/workspace');
const stixCoreDefinitions = require('./subschemas/stix-core');

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
    x_mitre_version: String,
    x_mitre_attack_spec_version: String
};

// Create the definition
const relationshipDefinition = {
    workspace: {
        ...workspaceDefinitions.common
    },
    stix: {
        ...stixCoreDefinitions.commonRequiredSDO,
        ...stixCoreDefinitions.commonOptionalSDO,
        ...relationshipProperties
    }
};

// Create the schema
const relationshipSchema = new mongoose.Schema(relationshipDefinition);

relationshipSchema.index({ 'stix.id': 1, 'stix.modified': -1 }, { unique: true });

// Create the model
const RelationshipModel = mongoose.model('Relationship', relationshipSchema);

module.exports = RelationshipModel;
