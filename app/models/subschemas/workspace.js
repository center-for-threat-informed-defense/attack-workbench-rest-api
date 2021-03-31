'use strict';

module.exports.common = {
    workflow: {
        state: {
            type: String,
            enum: [
                'work-in-progress',
                'awaiting-review',
                'reviewed'
            ]
        }
    },
    attack_id: String
};

const importError = {
    object_ref: { type: String, required: true },
    object_modified : { type: Date },
    error_type: { type: String, required: true },
    error_message: { type: String }
};

module.exports.collection = {
    imported: Date,
    import_categories: {
        additions: [ String ],
        changes: [ String ],
        minor_changes: [ String ],
        revocations: [ String ],
        deprecations: [ String ],
        supersedes_user_edits: [ String ],
        supersedes_collection_changes: [ String ],
        duplicates: [ String ],
        out_of_date: [ String ],
        errors: [ importError ]
    },
    import_references: {
        additions: [ String ],
        changes: [ String ]
    }
};
