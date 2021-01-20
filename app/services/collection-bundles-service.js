'use strict';

const collectionsService = require('../services/collections-service');
const techniquesService = require('../services/techniques-service');
const tacticsService = require('../services/tactics-service');
const groupsService = require('../services/groups-service');
const mitigationsService = require('../services/mitigations-service');
const softwareService = require('../services/software-service');
const matricesService = require('../services/matrices-service');
const relationshipService = require('../services/relationships-service');

const async = require('async');

const errors = {
    duplicateCollection: 'Duplicate collection'
};
exports.errors = errors;

const importErrors = {
    retrievalError: 'Retrieval error',
    unknownObjectType: 'Unknown object type',
    notInContents: 'Not in contents',  // object in bundle but not in x_mitre_contents
    missingObject: 'Missing object'    // object in x_mitre_contents but not in bundle
}

function hashEntry(stixId, modified) {
    return stixId + '/' + modified;
}

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
                supersedes_collection_changes: [],
                duplicates: [],
                out_of_date: [],
                errors: []
            }
        },
        stix: collection
    };

    // Build a map of the objects in x_mitre_contents
    const contentsMap = new Map();
    for (const entry of collection.x_mitre_contents) {
        contentsMap.set(hashEntry(entry.object_ref, entry.object_modified), entry);
    }

    async.series(
        [
            // Check for a duplicate x-mitre-collection object
            function(callback1) {
                collectionsService.retrieveById(importedCollection.stix.id, { versions: 'all' }, function(err, collections) {
                    if (err) {
                        return callback1(err);
                    }
                    else {
                        const duplicateCollection = collections.find(collection => {
                            // Imported objects may have more decimal places in the seconds than toISOString() creates
                            // So convert everything to a single format
                            // TBD: Come up with a cleaner solution
                            const existingCollectionTimestamp = collection.stix.modified.toISOString();
                            const importedCollectionTimestamp = new Date(importedCollection.stix.modified).toISOString();
                            return existingCollectionTimestamp === importedCollectionTimestamp;
                        });
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
                        // Check to see if the object is in x_mitre_contents
                        if (!contentsMap.delete(hashEntry(importObject.id, importObject.modified)) && importObject.type !== 'x-mitre-collection') {
                            // Not found in x_mitre_contents
                            // Record the error but continue processing the object
                            const importError = {
                                object_ref: importObject.id,
                                object_modified: importObject.modified,
                                error_type: importErrors.notInContents
                            }
                            importedCollection.workspace.import_categories.errors.push(importError);
                        }

                        let service;
                        if (importObject.type === 'attack-pattern') {
                            service = techniquesService;
                        }
                        else if (importObject.type === 'x-mitre-tactic') {
                            service = tacticsService;
                        }
                        else if (importObject.type === 'intrusion-set') {
                            service = groupsService;
                        }
                        else if (importObject.type === 'course-of-action') {
                            service = mitigationsService;
                        }
                        else if (importObject.type === 'malware' || importObject.type === 'tool') {
                            service = softwareService;
                        }
                        else if (importObject.type === 'x-mitre-matrix') {
                            service = matricesService;
                        }
                        else if (importObject.type === 'relationship') {
                            service = relationshipService;
                        }

                        if (service) {
                            // Retrieve all the objects with the same stix ID
                            service.retrieveById(importObject.id, { versions: 'all' }, function(err, objects) {
                                if (err) {
                                    // Record the error, but don't cancel the import
                                    const importError = {
                                        object_ref: importObject.id,
                                        object_modified: importObject.modified,
                                        error_type: importErrors.retrievalError
                                    }
                                    importedCollection.workspace.import_categories.errors.push(importError);
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
                                            // TBD: change x_mitre_version comparison from lexical to numerical
                                            if (latestExistingObject.stix.x_mitre_version < importObject.x_mitre_version) {
                                                // This a change (same stixId, higher x-mitre-version, later modified)
                                                importedCollection.workspace.import_categories.changes.push(importObject.id);
                                            }
                                            else if (latestExistingObject.stix.x_mitre_version > importObject.x_mitre_version) {
                                                // TBD: How to handle if modified is later, but x_mitre_version is lower
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
                                        const newObject = {
                                            workspace: {
                                                domains: []
                                            },
                                            stix: importObject
                                        };
                                        service.create(newObject, function (err, savedObject) {
                                            if (err) {
                                                if (err.message === service.errors.duplicateId) {
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
                            if (importObject.type === 'x-mitre-collection') {
                                // Skip x-mitre-collection objects
                                process.nextTick(() => callback2a());
                            }
                            else {
                                // Unknown object type
                                // Record the error, but don't cancel the import
                                const importError = {
                                    object_ref: importObject.id,
                                    object_modified: importObject.modified,
                                    error_type: importErrors.unknownObjectType
                                }
                                importedCollection.workspace.import_categories.errors.push(importError);
                                process.nextTick(() => callback2a());
                            }
                        }
                    },
                    function(err) {
                        // All the entries in the entry map should be removed now
                        for (const entry of contentsMap.values()) {
                            // Object was in x_mitre_contents but not in the bundle
                            const importError = {
                                object_ref: entry.object_ref,
                                object_modified: entry.object_modified,
                                error_type: importErrors.missingObject
                            }
                            importedCollection.workspace.import_categories.errors.push(importError);
                        }

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
