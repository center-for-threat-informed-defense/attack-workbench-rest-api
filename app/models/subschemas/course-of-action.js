'use strict';

module.exports.courseOfAction = {
    // course-of-action specific properties
    name: { type: String, required: true },
    description: String,

    // ATT&CK custom stix properties
    x_mitre_deprecated: Boolean,
    x_mitre_domains: [ String ],
    x_mitre_version: String
};

// No domain-specific properties
