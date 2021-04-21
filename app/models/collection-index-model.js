'use strict';

const mongoose = require('mongoose');

// Create the definition
const collectionVersionDefinition = {
    version: { type: String, required: true },
    modified: { type: Date, required: true },
    url: { type: String },
    taxii_url: { type: String },
    release_notes: { type: String }
};
const collectionVersionSchema = new mongoose.Schema(collectionVersionDefinition, { _id: false });

const collectionReferenceDefinition = {
    id: { type: String, required: true },
    name : { type: String, required: true },
    description : { type: String },
    created : { type: Date, required: true },
    versions : [ collectionVersionSchema ]
};
const collectionReferenceSchema = new mongoose.Schema(collectionReferenceDefinition, { _id: false });

// This is the collection index that was retrieved
const collectionIndexObjectDefinition = {
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    created: { type: Date, required: true },
    modified: { type: Date, required: true },
    collections: [ collectionReferenceSchema ]
};

// This is the collection index with its workspace data
const collectionIndexWrapperDefinition = {
    collection_index: {
        ...collectionIndexObjectDefinition
    },
    workspace: {
        remote_url: { type: String },
        update_policy: {
            automatic: { type: Boolean },
            interval: { type: Number },
            last_retrieval: { type: Date },
            subscriptions: [ String ]
        }
    }
};

// Create the schema
const options = {
    collection: 'collectionIndexes'
};
const collectionIndexSchema = new mongoose.Schema(collectionIndexWrapperDefinition, options);

// Add an index on id
// This improves the efficiency of queries and enforces uniqueness on this property
collectionIndexSchema.index({ 'collection_index.id': 1 }, { unique: true });

// Create the model
const CollectionIndexModel = mongoose.model('CollectionIndexModel', collectionIndexSchema);

module.exports = CollectionIndexModel;
