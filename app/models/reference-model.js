'use strict';

const mongoose = require('mongoose');

// Create the definition
const referenceDefinition = {
    source_name: { type: String, required: true },
    description: { type: String, required: true },
    url: String
};

// Create the schema
const referenceSchema = new mongoose.Schema(referenceDefinition);

referenceSchema.index({ 'source_name': 1}, { unique: true });

// Create the model
const ReferenceModel = mongoose.model('Reference', referenceSchema);

module.exports = ReferenceModel;
