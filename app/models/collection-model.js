'use strict';

const mongoose = require('mongoose');
const AttackObject = require('./attack-object-model');
const xMitreCollectionDefinitions = require('./subschemas/x-mitre-collection');
const workspaceDefinitions = require('./subschemas/workspace');

// Create the definition
const collectionDefinition = {
    workspace: {
        ...workspaceDefinitions.collection
    },
    stix: {
        ...xMitreCollectionDefinitions.xMitreCollection
    }
};

// Create the schema
const collectionSchema = new mongoose.Schema(collectionDefinition);

// Create the model
const CollectionModel = AttackObject.discriminator('Collection', collectionSchema);

module.exports = CollectionModel;
