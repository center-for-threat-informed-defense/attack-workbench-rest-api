'use strict';

const stixCore = require('./stix-core');

module.exports.attackPattern = {
    // STIX attack-pattern specific properties
    modified: { type: Date, required: true },
    name: { type: String, required: true },
    description: String,
    kill_chain_phases: [ stixCore.killChainPhase ],

    // ATT&CK custom stix properties
    x_mitre_modified_by_ref: String,
    x_mitre_detection: String,
    x_mitre_platforms: [ String ],
    x_mitre_is_subtechnique: Boolean,
    x_mitre_deprecated: Boolean,
    x_mitre_domains: [ String ],
    x_mitre_version: String,
    x_mitre_contributors: [ String ]
};

// Domain specific properties
module.exports.attackPatternEnterpriseDomain = {
    x_mitre_data_sources: { type: [ String ], default: undefined },
    x_mitre_defense_bypassed: { type: [ String ], default: undefined },
    x_mitre_impact_type: { type: [ String ], default: undefined },
    x_mitre_permissions_required: { type: [ String ], default: undefined },
    x_mitre_system_requirements: { type: [ String ], default: undefined },
    x_mitre_effective_permissions: { type: [ String ], default: undefined },
    x_mitre_remote_support: Boolean
};

module.exports.attackPatternMobileDomain = {
    x_mitre_tactic_type: { type: [ String ], default: undefined }
};

module.exports.attackPatternICSDomain = {
    x_mitre_data_sources: { type: [ String ], default: undefined }
};
