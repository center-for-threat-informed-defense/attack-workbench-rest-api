'use strict';

const stixCoreDefinitions = require('./stix-core-definitions');

module.exports.attackPattern = {
    ...stixCoreDefinitions.commonProperties,

    // attack-pattern specific properties
    name: { type: String, required: true },
    description: String,
    kill_chain_phases: [ stixCoreDefinitions.killChainPhase ],

    // ATT&CK custom stix properties
    x_mitre_contributors: [ String ],
    x_mitre_data_sources: [ String ],
    x_mitre_deprecated: Boolean,
    x_mitre_detection: String,
    x_mitre_effective_permissions: [ String ],
    x_mitre_permissions_required: [ String ],
    x_mitre_platforms: [ String ],
    x_mitre_subtechnique: Boolean,
    x_mitre_system_requirements: [ String ],
    x_mitre_version: String
};
