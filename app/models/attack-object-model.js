'use strict';

const mongoose = require('mongoose');
const workspaceDefinitions = require('./subschemas/workspace');
const stixCoreDefinitions = require('./subschemas/stix-core');

// Create the definition
const attackObjectDefinition = {
    workspace: {
        ...workspaceDefinitions.common
    },
    stix: {
        ...stixCoreDefinitions.commonRequiredSDO,
        ...stixCoreDefinitions.commonOptionalSDO
    }
};

// Create the schema
const options = {
    collection: 'attackObjects'
};
const attackObjectSchema = new mongoose.Schema(attackObjectDefinition, options);

//Save the ATT&CK ID in a more easily queried location
const sourceNames = ['mitre-attack', 'mitre-mobile-attack', 'mobile-attack', 'mitre-ics-attack'];
attackObjectSchema.pre('save', function(next) {
    if (this.stix.external_references) {
        const mitreAttackReference = this.stix.external_references.find(externalReference => sourceNames.includes(externalReference.source_name));
        if (mitreAttackReference && mitreAttackReference.external_id) {
            this.workspace.attack_id = mitreAttackReference.external_id;
        }
    }
    return next();
});

// Add an index on stix.id and stix.modified
// This improves the efficiency of queries and enforces uniqueness on this combination of properties
attackObjectSchema.index({ 'stix.id': 1, 'stix.modified': -1 }, { unique: true })

// Create the model
const attackObjectModel = mongoose.model('AttackObject', attackObjectSchema);

module.exports = attackObjectModel;
