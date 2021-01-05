'use strict';

module.exports.intrusionSet = {
    // intrusion-set specific properties
    name: { type: String, required: true },
    description: String,

    // ATT&CK custom stix properties
    aliases: [ String ],
    x_mitre_version: String,
    x_mitre_contributors: [ String ]
};

// No domain-specific properties