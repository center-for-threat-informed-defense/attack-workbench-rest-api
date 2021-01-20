'use strict';

const mongoose = require('mongoose');
const workspaceDefinitions = require('./subschemas/workspace');
const stixCoreDefinitions = require('./subschemas/stix-core');

// Create the definition
const attackObjectDefinition = {
    workspace: {
        ...workspaceDefinitions.common
    },
    stix: {
        ...stixCoreDefinitions.commonRequiredSDO,
        ...stixCoreDefinitions.commonOptionalSDO
    }
};

// Create the schema
const options = {
    collection: 'attackObjects'
};
const attackObjectSchema = new mongoose.Schema(attackObjectDefinition, options);

// Add an index on stix.id and stix.modified
// This improves the efficiency of queries and enforces uniqueness on this combination of properties
attackObjectSchema.index({ 'stix.id': 1, 'stix.modified': -1 }, { unique: true })

// Create the model
const attackObjectModel = mongoose.model('AttackObject', attackObjectSchema);

module.exports = attackObjectModel;
