'use strict';

const collectionsService = require('../services/collections-service');
const techniquesService = require('../services/techniques-service');
const async = require('async');

const errors = {
    duplicateCollection: 'Duplicate collection'
};
exports.errors = errors;

exports.import = function(collection, data, checkOnly, callback) {
    // Create the x-mitre-collection object
    const importedCollection = {
        workspace: {
            imported: new Date().toISOString(),
            import_categories: {
                additions: [],
                changes: [],
                minor_changes: [],
                revocations: [],
                deprecations: [],
                supersedes_user_edits: [],
                supersedes_collection_changes: []
            }
        },
        stix: collection
    };

    async.series(
        [
            // Check for a duplicate x-mitre-collection object
            function(callback1) {
                collectionsService.retrieveById(importedCollection.stix.id, 'all', function(err, collections) {
                    if (err) {
                        return callback1(err);
                    }
                    else {
                        const duplicateCollection = collections.find(collection => collection.stix.modified.toISOString() === importedCollection.stix.modified);
                        if (duplicateCollection) {
                            const error = new Error(errors.duplicateCollection);
                            return callback1(error);
                        }
                        else {
                            return callback1();
                        }
                    }
                });
            },
            // Iterate over the objects
            function(callback2) {
                async.each(data.objects, function(importObject, callback2a) {
                        if (importObject.type === 'attack-pattern') {
                            // Retrieve all the objects with the same stix ID
                            techniquesService.retrieveById(importObject.id, 'all', function(err, objects) {
                                if (err) {
                                    // Record the error, but don't cancel the import
                                    importedCollection.workspace.import_categories.errors.push(importObject.id);
                                    return callback2a();
                                }
                                else {
                                    // Is this a duplicate? (same stixId and modified)
                                    const duplicateObject = objects.find(object => object.stix.modified.toISOString() === importObject.modified);
                                    if (duplicateObject) {
                                        // Record the duplicate, but don't save it and don't cancel the import
                                        importedCollection.workspace.import_categories.duplicates.push(importObject.id);
                                        return callback2a();
                                    }

                                    // Is this an addition? (new stixId)
                                    if (objects.length === 0) {
                                        importedCollection.workspace.import_categories.additions.push(importObject.id);
                                    }
                                    else {
                                        const latestExistingObject = objects[0];
                                        if (latestExistingObject.stix.modified.toISOString() < importObject.modified) {
                                            if (latestExistingObject.stix.x_mitre_version < importObject.x_mitre_version) {
                                                // This a change (same stixId, higher x-mitre-version, later modified)
                                                importedCollection.workspace.import_categories.changes.push(importObject.id);
                                            }
                                            else if (latestExistingObject.stix.x_mitre_version > importObject.x_mitre_version) {
                                                // TBD: How to handle if modifed is later, but x_mitre_version is lower
                                            }
                                            else {
                                                // This a minor change (same stixId, same x-mitre-version, later modified)
                                                importedCollection.workspace.import_categories.minor_changes.push(importObject.id);
                                            }
                                        }
                                        else {
                                            // Imported object is older than latest existing object
                                            importedCollection.workspace.import_categories.out_of_date.push(importObject.id);
                                        }
                                    }

                                    // Save the object
                                    if (checkOnly) {
                                        // Do nothing
                                        process.nextTick(() => callback2a());
                                    }
                                    else {
                                        const technique = {
                                            workspace: {
                                                domains: []
                                            },
                                            stix: importObject
                                        };
                                        techniquesService.create(technique, function (err, savedTechnique) {
                                            if (err) {
                                                if (err.message === techniquesService.errors.duplicateId) {
                                                    return callback2a(err);
                                                } else {
                                                    return callback2a(err);
                                                }
                                            } else {
                                                return callback2a();
                                            }
                                        });
                                    }
                                }
                            });
                        }
                        else {
                            process.nextTick(() => callback2a());
                        }
                    },
                    function(err) {
                        return callback2(err);
                    })
            },
            // Save the x-mitre-collection object
            function(callback3) {
                if (checkOnly) {
                    // Do nothing
                    process.nextTick(() => callback3(null, importedCollection));
                }
                else {
                    collectionsService.create(importedCollection, function(err, savedCollection) {
                        if (err) {
                            if (err.name === 'MongoError' && err.code === 11000) {
                                // 11000 = Duplicate index
                                const error = new Error(errors.duplicateCollection);
                                return callback3(error);
                            } else {
                                return callback3(err);
                            }
                        } else {
                            return callback3(null, savedCollection);
                        }
                    });
                }
            }
        ],
        function(err, results) {
            if (err) {
                return callback(err);
            }
            else {
                return callback(null, results[2]);
            }
        }
    );
};
