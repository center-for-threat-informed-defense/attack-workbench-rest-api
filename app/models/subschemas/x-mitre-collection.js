'use strict';

module.exports.xMitreCollection = {
    name: { type: String, required: true },
    description: String,
    x_mitre_content: [ xMitreContent ],
    x_mitre_version: String
};

const xMitreContent = {
    object_ref: { type: String, required: true },
    object_modified : { type: Date, required: true }
};
