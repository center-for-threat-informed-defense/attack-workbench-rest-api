'use strict';

const mongoose = require('mongoose');
const AttackObject = require('./attack-object-model');
const { ModelName } = require('../lib/model-names');

const stixDataComponent = {
    // STIX x-mitre-data-component specific properties
    modified: { type: Date, required: true },
    name: { type: String, required: true },
    description: String,

    // ATT&CK custom stix properties
    x_mitre_data_source_ref: String,
    x_mitre_modified_by_ref: String,
    x_mitre_deprecated: Boolean,
    x_mitre_domains: [ String ],
    x_mitre_version: String,
    x_mitre_attack_spec_version: String
};

// Create the definition
const dataComponentDefinition = {
    stix: {
        ...stixDataComponent
    }
};

// Create the schema
const dataComponentSchema = new mongoose.Schema(dataComponentDefinition);

// Create the model
const DataComponentModel = AttackObject.discriminator(ModelName.DataComponent, dataComponentSchema);

module.exports = DataComponentModel;
