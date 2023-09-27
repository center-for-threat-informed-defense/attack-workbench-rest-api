'use strict';

const mongoose = require('mongoose');
const AttackObject = require('./attack-object-model');
const { ModelName } = require('../lib/attack-prefix-ids');

const noteProperties = {
    // note specific properties
    modified: { type: Date, required: true },
    abstract: String,
    content: { type: String, required: true },
    authors: [ String ],
    object_refs: { type: [ String ], required: true },

    // ATT&CK custom stix properties
    x_mitre_modified_by_ref: String,
    x_mitre_deprecated: Boolean,
    x_mitre_attack_spec_version: String
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
const NoteModel = AttackObject.discriminator(ModelName.Note, noteSchema);

module.exports = NoteModel;
