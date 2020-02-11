'use strict';

module.exports.commonProperties = {
    type: { type: String, required: true },
    spec_version: { type: String, required: true },
    id: { type: String, required: true },
    created_by_ref: { type: String },
    created: { type: Date, required: true },
    modified: { type: Date, required: true },
    revoked: { type: Boolean },
    external_references: [],
    object_marking_refs: [],
};

module.exports.killChainPhase = {
    kill_chain_name: { type: String, required: true },
    phase_name : { type: String, required: true }
};
