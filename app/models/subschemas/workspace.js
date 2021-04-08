'use strict';

const collectionVersion = {
    collection_ref: { type: String, required: true },
    collection_modified : { type: Date, required: true }
}

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
    attack_id: String,
    collections: [ collectionVersion ]
};

const exportData = {
    export_timestamp: Date,
    bundle_id: String
};

const importError = {
    object_ref: { type: String, required: true },
    object_modified : { type: Date },
    error_type: { type: String, required: true },
    error_message: { type: String }
};

module.exports.collection = {
    imported: Date,
    exported: [ exportData ],
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
