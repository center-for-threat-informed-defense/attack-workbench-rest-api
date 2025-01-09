'use strict';

const mongoose = require('mongoose');
const AttackObject = require('./attack-object-model');
const attackPatternDefinitions = require('./subschemas/attack-pattern');
const { ModelName } = require('../lib/model-names');

// Create the definition
const techniqueDefinition = {
  stix: {
    ...attackPatternDefinitions.attackPattern,
  },
};
// Use Object.assign() to add properties in case there are duplicates
Object.assign(techniqueDefinition.stix, attackPatternDefinitions.attackPatternEnterpriseDomain);
Object.assign(techniqueDefinition.stix, attackPatternDefinitions.attackPatternMobileDomain);
Object.assign(techniqueDefinition.stix, attackPatternDefinitions.attackPatternICSDomain);

// Create the schema
const techniqueSchema = new mongoose.Schema(techniqueDefinition);

// Create the model
const TechniqueModel = AttackObject.discriminator(ModelName.Technique, techniqueSchema);

module.exports = TechniqueModel;
