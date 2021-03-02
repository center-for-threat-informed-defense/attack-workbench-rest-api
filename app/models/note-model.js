'use strict';

const mongoose = require('mongoose');
const AttackObject = require('./attack-object-model');

const noteProperties = {
    // note specific properties
    modified: { type: Date, required: true },
    abstract: String,
    content: { type: String, required: true },
    authors: [ String ],
    object_refs: { type: [ String ], required: true }
};

// Create the definition
const noteDefinition = {
    stix: {
        ...noteProperties
    }
};

// Create the schema
const noteSchema = new mongoose.Schema(noteDefinition);

// Create the model
const NoteModel = AttackObject.discriminator('NoteModel', noteSchema);

module.exports = NoteModel;
