'use strict';

module.exports.intrusionSet = {
    // intrusion-set specific properties
    modified: { type: Date, required: true },
    name: { type: String, required: true },
    description: String,

    // ATT&CK custom stix properties
    aliases: [ String ],
    x_mitre_domains: [ String ],
    x_mitre_version: String,
    x_mitre_contributors: [ String ]
};

// No domain-specific properties
