'use strict';

const mongoose = require('mongoose');
const AttackObject = require('./attack-object-model');
const workspaceDefinitions = require('./subschemas/workspace');

const xMitreContent = {
    object_ref: { type: String, required: true },
    object_modified : { type: Date, required: true }
};

const xMitreCollection = {
    modified: { type: Date, required: true },
    name: { type: String, required: true },
    description: String,
    x_mitre_contents: [ xMitreContent ],
    x_mitre_deprecated: Boolean,
    x_mitre_domains: [ String ],
    x_mitre_version: String
};

// Create the definition
const collectionDefinition = {
    workspace: {
        ...workspaceDefinitions.collection
    },
    stix: {
        ...xMitreCollection
    }
};

// Create the schema
const collectionSchema = new mongoose.Schema(collectionDefinition);

// Create the model
const CollectionModel = AttackObject.discriminator('Collection', collectionSchema);

module.exports = CollectionModel;
