'use strict';

module.exports.software = {
    // software specific properties
    name: { type: String, required: true },
    description: String,
    labels: [ String ],

    // ATT&CK custom stix properties
    x_mitre_platforms: [ String ],
    x_mitre_deprecated: Boolean,
    x_mitre_version: String,
    x_mitre_contributors: [ String ],
    x_mitre_aliases: [ String ],
};

// No domain-specific properties

