'use strict';

exports.import = function(collection, data, checkOnly, callback) {
    process.nextTick(() => {
        const importedCollection = {
            workspace: {
                imported: new Date().toISOString(),
                import_categories: {
                    additions: [],
                    changes: [],
                    minor_changes: [],
                    revocations: [],
                    deprecations: [],
                    supercedes_user_edits: [],
                    supercedes_collection_changes: []
                }
            },
            stix: collection
        };
        return callback(null, importedCollection);
    });
};
