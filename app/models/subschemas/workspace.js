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

module.exports.collection = {
    imported: Date,
    import_categories: {
        additions: [ String ],
        changes: [ String ],
        minor_changes: [ String ],
        revocations: [ String ],
        deprecations: [ String ],
        supersedes_user_edits: [ String ],
        supersedes_collection_changes: [ String ]
    }
};
