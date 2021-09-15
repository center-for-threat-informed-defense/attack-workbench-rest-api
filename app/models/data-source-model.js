'use strict';

const mongoose = require('mongoose');
const AttackObject = require('./attack-object-model');

const stixDataSource = {
    // STIX x-mitre-data-source specific properties
    modified: { type: Date, required: true },
    name: { type: String, required: true },
    description: String,

    // ATT&CK custom stix properties
    x_mitre_modified_by_ref: String,
    x_mitre_platforms: [ String ],
    x_mitre_deprecated: Boolean,
    x_mitre_domains: [ String ],
    x_mitre_version: String,
    x_mitre_contributors: [ String ],
    x_mitre_collection_layers: [ String ]
};

// Create the definition
const dataSourceDefinition = {
    stix: {
        ...stixDataSource
    }
};

// Create the schema
const dataSourceSchema = new mongoose.Schema(dataSourceDefinition);

// Create the model
const DataSourceModel = AttackObject.discriminator('Data-Source', dataSourceSchema);

module.exports = DataSourceModel;
