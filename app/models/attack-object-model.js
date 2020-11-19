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

// Create the model
const attackObjectModel = mongoose.model('AttackObject', attackObjectSchema);

module.exports = attackObjectModel;
