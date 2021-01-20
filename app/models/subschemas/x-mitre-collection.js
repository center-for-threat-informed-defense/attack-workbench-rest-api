'use strict';

const xMitreContent = {
    object_ref: { type: String, required: true },
    object_modified : { type: Date, required: true }
};

module.exports.xMitreCollection = {
    name: { type: String, required: true },
    description: String,
    x_mitre_contents: [ xMitreContent ],
    x_mitre_domains: [ String ],
    x_mitre_version: String
};
