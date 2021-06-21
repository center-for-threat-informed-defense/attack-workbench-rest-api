'use strict';

const uuid = require('uuid');

const collectionsService = require('../services/collections-service');
const techniquesService = require('../services/techniques-service');
const tacticsService = require('../services/tactics-service');
const groupsService = require('../services/groups-service');
const mitigationsService = require('../services/mitigations-service');
const softwareService = require('../services/software-service');
const matricesService = require('../services/matrices-service');
const relationshipService = require('../services/relationships-service');
const markingDefinitionsService = require('../services/marking-definitions-service');
const identitiesService = require('../services/identities-service');
const notesService = require('../services/notes-service');
const referencesService = require('../services/references-service');

const async = require('async');

const errors = {
    duplicateCollection: 'Duplicate collection',
    notFound: 'Collection not found',
};
exports.errors = errors;

const importErrors = {
    retrievalError: 'Retrieval error',
    unknownObjectType: 'Unknown object type',
    notInContents: 'Not in contents',  // object in bundle but not in x_mitre_contents
    missingObject: 'Missing object',    // object in x_mitre_contents but not in bundle
    saveError: 'Save error'
}

function makeKey(stixId, modified) {
    return stixId + '/' + modified;
}

function makeKeyFromObject(stixObject) {
    if (stixObject.type === 'marking-definition') {
        return makeKey(stixObject.id, stixObject.created);
    }
    else {
        return makeKey(stixObject.id, stixObject.modified);
    }
}

// Convert the date to seconds past the epoch
// Works for both Date and string types
function toEpoch(date) {
    if (date instanceof Date) {
        return date.getTime();
    }
    else {
        return Date.parse(date);
    }
}

exports.validateBundle = function(bundle) {
    const validationResult = {
        errors: []
    };

    // Check for duplicate objects in the bundle
    const objectMap = new Map();
    for (const stixObject of bundle.objects) {
        if (objectMap.has(makeKey(stixObject.id, stixObject.modified))) {
            // Object already in map: duplicate STIX id and modified date
            const error = {
                type: 'duplicate',
                id: stixObject.id,
                modified: stixObject.modified
            };
            validationResult.errors.push(error);
        }
        else {
            objectMap.set(makeKey(stixObject.id, stixObject.modified), stixObject);
        }
    }

    return validationResult;
}

exports.importBundle = function(collection, data, options, callback) {
    const referenceImportResults = {
        uniqueReferences: 0,
        duplicateReferences: 0,
        aliasReferences: 0
    };

    // Create the collection reference
    const collectionReference = {
        collection_ref: collection.id,
        collection_modified: collection.modified
    };

    // Create the x-mitre-collection object
    const importedCollection = {
        workspace: {
            imported: new Date().toISOString(),
            exported: [],
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
            },
            import_references: {
                additions: [],
                changes: [],
                duplicates: []
            }
        },
        stix: collection
    };

    // Build a map of the objects in x_mitre_contents
    const contentsMap = new Map();
    for (const entry of collection.x_mitre_contents) {
        contentsMap.set(makeKey(entry.object_ref, entry.object_modified), entry);
    }

    const importReferences = new Map();

    async.series(
        [
            // Check for a duplicate x-mitre-collection object
            function(callback1) {
                collectionsService.retrieveById(importedCollection.stix.id, { versions: 'all' }, function(err, collections) {
                    if (err) {
                        return callback1(err);
                    }
                    else {
                        const duplicateCollection = collections.find(collection => toEpoch(collection.stix.modified) === toEpoch(importedCollection.stix.modified));
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
                async.eachLimit(data.objects, 8, function(importObject, callback2a) {
                        // Check to see if the object is in x_mitre_contents
                        if (!contentsMap.delete(makeKeyFromObject(importObject)) && importObject.type !== 'x-mitre-collection') {
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
                        else if (importObject.type === 'marking-definition') {
                            service = markingDefinitionsService;
                        }
                        else if (importObject.type === 'identity') {
                            service = identitiesService;
                        }
                        else if (importObject.type === 'note') {
                            service = notesService;
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
                                    if (importObject.type === 'marking-definition') {
                                        const duplicateObject = objects.find(object => toEpoch(object.stix.created) === toEpoch(importObject.created));
                                        if (duplicateObject) {
                                            // Record the duplicate, but don't save it and don't cancel the import
                                            importedCollection.workspace.import_categories.duplicates.push(importObject.id);
                                            return callback2a();
                                        }
                                    }
                                    else {
                                        const duplicateObject = objects.find(object => toEpoch(object.stix.modified) === toEpoch(importObject.modified));
                                        if (duplicateObject) {
                                            // Record the duplicate, but don't save it and don't cancel the import
                                            importedCollection.workspace.import_categories.duplicates.push(importObject.id);
                                            return callback2a();
                                        }
                                    }

                                    // Is this an addition? (new stixId)
                                    if (objects.length === 0) {
                                        importedCollection.workspace.import_categories.additions.push(importObject.id);
                                    }
                                    else {
                                        const latestExistingObject = objects[0];

                                        if (importObject.revoked && !latestExistingObject.revoked) {
                                            // This a newly revoked object
                                            importedCollection.workspace.import_categories.revocations.push(importObject.id);
                                        }
                                        else if (importObject.x_mitre_deprecated && !latestExistingObject.x_mitre_deprecated) {
                                            // This a newly deprecated object
                                            importedCollection.workspace.import_categories.deprecations.push(importObject.id);
                                        }
                                        else if (toEpoch(latestExistingObject.stix.modified) < toEpoch(importObject.modified)) {
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

                                    // Extract the references from the object
                                    if (importObject.external_references && Array.isArray(importObject.external_references)) {
                                        for (const externalReference of importObject.external_references) {
                                            if (externalReference.source_name && externalReference.description && !externalReference.external_id) {

                                                // Is this reference just an alias?
                                                let isAlias = false;
                                                if (importObject.type === 'intrusion-set') {
                                                    if (importObject.aliases && importObject.aliases.includes(externalReference.source_name)) {
                                                        isAlias = true;
                                                    }
                                                }
                                                else if (importObject.type === 'malware' || importObject.type === 'tool') {
                                                    if (importObject.x_mitre_aliases && importObject.x_mitre_aliases.includes(externalReference.source_name)) {
                                                        isAlias = true;
                                                    }
                                                }

                                                if (isAlias) {
                                                    referenceImportResults.aliasReferences++;
                                                }
                                                else {
                                                    if (importReferences.has(externalReference.source_name)) {
                                                        referenceImportResults.duplicateReferences++;
                                                        // if (externalReference.description === importReferences.get(externalReference.source_name)) {
                                                        //     // Duplicate in collection bundle -- skip
                                                        // } else {
                                                        //     // Duplicate source name in collection bundle, but description is different
                                                        //     // Skip for now
                                                        // }
                                                    } else {
                                                        referenceImportResults.uniqueReferences++;
                                                        importReferences.set(externalReference.source_name, externalReference);
                                                    }
                                                }
                                            }
                                        }
                                    }

                                    // Save the object
                                    if (options.previewOnly) {
                                        // Do nothing
                                        return callback2a();
                                    }
                                    else {
                                        const newObject = {
                                            workspace: {
                                                collections: [ collectionReference ]
                                            },
                                            stix: importObject
                                        };
                                        if (importObject.type === 'marking-definition') {
                                            service.create(newObject, { import: true })
                                                .then(function (savedObject) {
                                                    return callback2a();
                                                })
                                                .catch(function(err) {
                                                    if (err.message === service.errors.duplicateId) {
                                                        return callback2a(err);
                                                    } else {
                                                        return callback2a(err);
                                                    }
                                                });
                                        }
                                        else {
                                            if (service.createIsAsync) {
                                                service.create(newObject, { import: true })
                                                    .then(function(savedObject) {
                                                        return callback2a();
                                                    })
                                                    .catch(function(err) {
                                                        if (err.message === service.errors.duplicateId) {
                                                            // We've checked for this already, so this shouldn't occur
                                                            return callback2a(err);
                                                        } else {
                                                            // Record the error, but don't cancel the import
                                                            const importError = {
                                                                object_ref: importObject.id,
                                                                object_modified: importObject.modified,
                                                                error_type: importErrors.saveError,
                                                                error_message: err.message
                                                            }
                                                            importedCollection.workspace.import_categories.errors.push(importError);
                                                            return callback2a();
                                                        }
                                                    });
                                            }
                                            else {
                                                service.create(newObject, function (err, savedObject) {
                                                    if (err) {
                                                        if (err.message === service.errors.duplicateId) {
                                                            // We've checked for this already, so this shouldn't occur
                                                            return callback2a(err);
                                                        } else {
                                                            // Record the error, but don't cancel the import
                                                            const importError = {
                                                                object_ref: importObject.id,
                                                                object_modified: importObject.modified,
                                                                error_type: importErrors.saveError,
                                                                error_message: err.message
                                                            }
                                                            importedCollection.workspace.import_categories.errors.push(importError);
                                                            return callback2a();
                                                        }
                                                    } else {
                                                        return callback2a();
                                                    }
                                                });
                                            }
                                        }
                                    }
                                }
                            });
                        }
                        else {
                            if (importObject.type === 'x-mitre-collection') {
                                // Skip x-mitre-collection objects
                                return callback2a();
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
                                return callback2a();
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
            // Import the new references
            function(callback3) {
                const options = {};
                referencesService.retrieveAll(options)
                    .then(function(references) {
                        const existingReferences = new Map(references.map(item => [ item.source_name, item ]));

                        // Iterate over the import references
                        async.eachLimit([...importReferences.values()], 8, function(importReference, callback3a) {
                                if (existingReferences.has(importReference.source_name)) {
                                    // Duplicate of existing reference -- overwrite
                                    if (options.previewOnly) {
                                        // Do nothing
                                        importedCollection.workspace.import_references.changes.push(importReference.source_name);
                                        return callback3a();
                                    } else {
                                        // Save the reference
                                        referencesService.update(importReference)
                                            .then(function (reference) {
                                                importedCollection.workspace.import_references.changes.push(importReference.source_name);
                                                return callback3a();
                                            })
                                            .catch(function (err) {
                                                return callback3a(err);
                                            });
                                    }
                                } else {
                                    if (options.previewOnly) {
                                        // Do nothing
                                        importedCollection.workspace.import_references.additions.push(importReference.source_name);
                                        return callback3a();
                                    } else {
                                        // Save the reference
                                        referencesService.create(importReference)
                                            .then(function (reference) {
                                                importedCollection.workspace.import_references.additions.push(importReference.source_name);
                                                return callback3a();
                                            })
                                            .catch(function (err) {
                                                return callback3a(err);
                                            });
                                    }
                                }
                            },
                            function(err) {
                                return callback3(err);
                            });
                    })
                    .catch(err => callback3(err));
            },
            // Save the x-mitre-collection object
            function(callback4) {
                if (options.previewOnly) {
                    // Do nothing
                    process.nextTick(() => callback4(null, importedCollection));
                }
                else {
                    const options = { addObjectsToCollection: false, import: true };
                    collectionsService.create(importedCollection, options)
                        .then(function(result) {
                            return callback4(null, result.savedCollection);
                        })
                        .catch(function(err) {
                            if (err.name === 'MongoError' && err.code === 11000) {
                                // 11000 = Duplicate index
                                const error = new Error(errors.duplicateCollection);
                                return callback4(error);
                            } else {
                                return callback4(err);
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
                return callback(null, results[3]);
            }
        }
    );
};

function createBundle(collection, options, callback) {
    // Create the bundle to hold the exported objects
    const bundle = {
        type: 'bundle',
        id: `bundle--${uuid.v4()}`,
        objects: []
    };

    // Put the collection object in the bundle
    bundle.objects.push(collection.stix);

    // Put the contents in the bundle
    for (const attackObject of collection.contents) {
        bundle.objects.push(attackObject.stix);
    }

    if (options.previewOnly) {
        return callback(null, bundle);
    }
    else {
        const exportData = {
            export_timestamp: new Date(),
            bundle_id: bundle.id
        }
        // Mark all of the objects as belonging to the bundle
        collectionsService.insertExport(collection.stix.id, collection.stix.modified, exportData)
            .then(function (err) {
                if (err) {
                    return callback(err);
                } else {
                    return callback(null, bundle);
                }
            });
    }
}

exports.exportBundle = function(options, callback) {
    if (options.collectionModified) {
        // Retrieve the collection with the provided id and modified date
        const retrievalOptions = { retrieveContents: true };
        collectionsService.retrieveVersionById(options.collectionId, options.collectionModified, retrievalOptions, function(err, collection) {
            if (err) {
                return callback(err);
            }
            else {
                if (collection) {
                    createBundle(collection, options, function (err, bundle) {
                        if (err) {
                            return callback(err);
                        } else {
                            return callback(null, bundle);
                        }
                    });
                } else {
                    const error = new Error(errors.notFound);
                    return callback(error);
                }
            }
        });
    }
    else {
        // Retrieve the latest collection with the provided id
        const retrievalOptions = {
            versions: 'latest',
            retrieveContents: true
        };
        collectionsService.retrieveById(options.collectionId, retrievalOptions, function (err, collections) {
            if (err) {
                return callback(err);
            } else {
                if (collections.length === 1) {
                    const exportedCollection = collections[0];
                    createBundle(exportedCollection, options, function (err, bundle) {
                        if (err) {
                            return callback(err);
                        } else {
                            return callback(null, bundle);
                        }
                    });
                } else if (collections.length === 0) {
                    const error = new Error(errors.notFound);
                    return callback(error);
                } else {
                    const error = new Error('Unknown error occurred');
                    return callback(error);
                }
            }
        });
    }
}
