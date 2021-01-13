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
        supercedes_user_edits: [ String ],
        supercedes_collection_changes: [ String ]
    }
};
