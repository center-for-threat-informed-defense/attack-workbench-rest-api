'use strict';

const mongoose = require('mongoose');
const AttackObject = require('./attack-object-model');
const softwareDefinitions = require('./subschemas/software');

// Create the definition
const softwareDefinition = {
    stix: {
        ...softwareDefinitions.software
    }
};

// Create the schema
const softwareSchema = new mongoose.Schema(softwareDefinition);

// Create the model
const SoftwareModel = AttackObject.discriminator('Software', softwareSchema);

module.exports = SoftwareModel;