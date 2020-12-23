'use strict';

module.exports.tactic = {
    // tactic specific properties
    name: { type: String, required: true },
    description: String,

    // ATT&CK custom stix properties
    x_mitre_deprecated: Boolean,
    x_mitre_version: String,
    x_mitre_contributors: [ String ],
    x_mitre_shortname: String
};

// No domain-specific properties