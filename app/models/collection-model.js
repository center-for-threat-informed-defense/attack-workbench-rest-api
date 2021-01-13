'use strict';

const mongoose = require('mongoose');
const AttackObject = require('./attack-object-model');
const xMitreCollectionDefinitions = require('./subschemas/x-mitre-collection');

// Create the definition
const collectionDefinition = {
    stix: {
        ...xMitreCollectionDefinitions.xMitreCollection
    }
};

// Create the schema
const collectionSchema = new mongoose.Schema(collectionDefinition);

// Create the model
const CollectionModel = AttackObject.discriminator('Collection', collectionSchema);

module.exports = CollectionModel;
