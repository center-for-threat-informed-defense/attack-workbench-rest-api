'use strict';

module.exports.common = {
    domains: [ String ],
    workflow: {
        state: {
            type: String,
            enum: [
                'work-in-progress',
                'awaiting-review',
                'reviewed'
            ]
        }
    }
};

const importError = {
    object_ref: { type: String, required: true },
    object_modified : { type: Date, required: true },
    error_type: { type: String, required: true }
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
    }
};
