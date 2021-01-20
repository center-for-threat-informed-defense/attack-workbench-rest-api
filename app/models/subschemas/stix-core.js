'use strict';

const external_reference = {
    source_name: { type: String, required: true },
    description: { type: String },
    url: { type: String },
    external_id: { type: String }
};
module.exports.external_reference = external_reference;

module.exports.killChainPhase = {
    kill_chain_name: { type: String, required: true },
    phase_name : { type: String, required: true }
};

module.exports.commonRequiredSDO = {
    type: {
        type: String,
        enum: ['attack-pattern',
            'course-of-action',
            'identity',
            'intrusion-set',
            'malware',
            'marking-definition',
            'relationship',
            'tool',
            'x-mitre-collection',
            'x-mitre-data-source',
            'x-mitre-matrix',
            'x-mitre-tactic'
        ]
    },
    spec_version: { type: String, required: true },
    id: { type: String, required: true },
    created: { type: Date, required: true },
    modified: { type: Date, required: true }
};

module.exports.commonOptionalSDO = {
    created_by_ref: { type: String },
    revoked: { type: Boolean },
    external_references: [ external_reference ],
    object_marking_refs: [ String ]
};
