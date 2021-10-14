'use strict';

const uuid = require('uuid');
const util = require('util');
const semver = require('semver');

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
const dataSourcesService = require('../services/data-sources-service');
const dataComponentsService = require('../services/data-components-service');

const Collection = require('../models/collection-model');

const logger = require('../lib/logger');
const config = require('../config/config');

const async = require('async');
const systemConfigurationService = require("./system-configuration-service");

const forceImportParameters = {
    attackSpecVersionViolations: 'attack-spec-version-violations',
    duplicateCollection: 'duplicate-collection'
}
exports.forceImportParameters = forceImportParameters;

const errors = {
    duplicateCollection: 'Duplicate collection',
    notFound: 'Collection not found',
    attackSpecVersionViolation: 'ATT&CK Spec version violation'
};
exports.errors = errors;

const validationErrors = {
    duplicateObjectInBundle: 'Duplicate object in bundle',
    invalidAttackSpecVersion: 'Invalid ATT&CK Spec version'
};
exports.validationErrors = validationErrors;

const importErrors = {
    duplicateCollection: 'Duplicate collection object',
    retrievalError: 'Retrieval error',
    unknownObjectType: 'Unknown object type',
    notInContents: 'Not in contents',  // object in bundle but not in x_mitre_contents
    missingObject: 'Missing object',    // object in x_mitre_contents but not in bundle
    saveError: 'Save error',
    attackSpecVersionViolation: 'ATT&CK Spec version violation'
}

// Default ATT&CK Spec version to use for objects that do not have x_mitre_attack_spec_version set
// This isn't saved, but is used for comparisons
const defaultAttackSpecVersion = '2.0.0';

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
        errors: [],
        duplicateObjectInBundleCount: 0,
        invalidAttackSpecVersionCount: 0
    };

    // Validate the objects in the bundle
    const objectMap = new Map();
    for (const stixObject of bundle.objects) {
        // Check for a duplicate object
        const key = makeKey(stixObject.id, stixObject.modified);
        if (objectMap.has(key)) {
            // Object already in map: duplicate STIX id and modified date
            const error = {
                type: validationErrors.duplicateObjectInBundle,
                id: stixObject.id,
                modified: stixObject.modified
            };
            validationResult.errors.push(error);
            validationResult.duplicateObjectInBundleCount += 1;
        } else {
            objectMap.set(makeKey(stixObject.id, stixObject.modified), stixObject);
        }

        // Check the ATT&CK Spec version
        const objectAttackSpecVersion = stixObject.x_mitre_attack_spec_version ?? defaultAttackSpecVersion;
        if (semver.gt(objectAttackSpecVersion, config.app.attackSpecVersion)) {
            // Object's ATT&CK Spec version is newer than system can process
            const error = {
                type: validationErrors.invalidAttackSpecVersion,
                id: stixObject.id,
                modified: stixObject.modified
            };
            validationResult.errors.push(error);
            validationResult.invalidAttackSpecVersionCount += 1;
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
    let duplicateCollection;

    async.series(
        [
            // Check for a duplicate x-mitre-collection object
            function(callback1) {
                collectionsService.retrieveById(importedCollection.stix.id, { versions: 'all' }, function(err, collections) {
                    if (err) {
                        return callback1(err);
                    }
                    else {
                        duplicateCollection = collections.find(collection => toEpoch(collection.stix.modified) === toEpoch(importedCollection.stix.modified));
                        if (duplicateCollection) {
                            if (options.forceImportParameters?.find(param => param === forceImportParameters.duplicateCollection)) {
                                // Duplicate x-mitre-collection object
                                // Client wants to reimport collection
                                // Record the warning but continue processing the bundle
                                const importError = {
                                    object_ref: importedCollection.stix.id,
                                    object_modified: importedCollection.stix.modified,
                                    error_type: importErrors.duplicateCollection,
                                    error_message: `Warning: Duplicate x-mitre-collection object.`
                                }
                                logger.verbose(`Import Bundle Warning: Duplicate x-mitre-collection object. Continuing import due to forceImport parameter.`);
                                importedCollection.workspace.import_categories.errors.push(importError);

                                return callback1();
                            }
                            else {
                                const error = new Error(errors.duplicateCollection);
                                return callback1(error);
                            }
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
                                error_type: importErrors.notInContents,
                                error_message: `Warning: Object in bundle but not in x_mitre_contents. Object will be saved in database.`
                            }
                            logger.verbose(`Import Bundle Warning: Object not in x_mitre_contents. id = ${ importObject.id }, modified = ${ importObject.modified }`);
                            importedCollection.workspace.import_categories.errors.push(importError);
                        }

                        // Check to see if the object has a later ATT&CK Spec Version than this system can process
                        const objectAttackSpecVersion = importObject.x_mitre_attack_spec_version ?? defaultAttackSpecVersion;
                        if (semver.gt(objectAttackSpecVersion, config.app.attackSpecVersion)) {
                            // Do not save the object
                            const importError = {
                                object_ref: importObject.id,
                                object_modified: importObject.modified,
                                error_type: importErrors.attackSpecVersionViolation,
                                error_message: `Error: Object x_mitre_attack_spec_version later than system.`
                            }
                            logger.verbose(`Import Bundle Error: Object's x_mitre_attack_spec_version later than system. id = ${ importObject.id }, modified = ${ importObject.modified }`);
                            importedCollection.workspace.import_categories.errors.push(importError);

                            if (options.forceImportParameters.find(param => param === forceImportParameters.attackSpecVersionViolations)) {
                                // Skip this object but continue the import
                                return callback2a();
                            }
                            else {
                                // Stop the import
                                const error = new Error(errors.attackSpecVersionViolation);
                                return callback2a(error);
                            }
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
                        else if (importObject.type === 'x-mitre-data-source') {
                            service = dataSourcesService;
                        }
                        else if (importObject.type === 'x-mitre-data-component') {
                            service = dataComponentsService;
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
                                    logger.verbose(`Import Bundle Error: Unable to retrieve objects with matching STIX id. id = ${ importObject.id }, modified = ${ importObject.modified }`);
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
                                                            logger.verbose(`Import Bundle Error: Unable to save object. id = ${ importObject.id }, modified = ${ importObject.modified }, ${ err.message }`);
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
                                                            logger.verbose(`Import Bundle Error: Unable to save object. id = ${ importObject.id }, modified = ${ importObject.modified }, ${ err.message }`);
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
                                    error_type: importErrors.unknownObjectType,
                                    error_message: `Unknown object type: ${ importObject.type }`
                                }
                                logger.verbose(`Import Bundle Error: Unknown object type. id = ${ importObject.id }, modified = ${ importObject.modified }, type = ${ importObject.type }`);
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
                                error_type: importErrors.missingObject,
                                error_message: 'Object listed in x_mitre_contents, but not in bundle'
                            }
                            logger.verbose(`Import Bundle Error: Object in x_mitre_contents but not in bundle. id = ${ entry.object_ref }, modified = ${ entry.object_modified }`);
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
                if (duplicateCollection) {
                    // The x-mitre-collection object already exists, this is a reimport
                    // Add the results of the import to the workspace.reimports property
                    const reimport = {
                        imported: new Date().toISOString(),
                        import_categories: importedCollection.workspace.import_categories,
                        import_references: importedCollection.workspace.import_references
                    };
                    if (!duplicateCollection.workspace.reimports) {
                        duplicateCollection.workspace.reimports = [];
                    }
                    duplicateCollection.workspace.reimports.push(reimport);

                    if (options.previewOnly) {
                        // Do nothing
                        process.nextTick(() => callback4(null, importedCollection));
                    }
                    else {
                        const options = { new: true, lean: true };
                        Collection.findByIdAndUpdate(duplicateCollection._id, duplicateCollection, options, function (err, savedDocument) {
                            if (err) {
                                return callback4(err);
                            }
                            else {
                                return callback4(null, savedDocument);
                            }
                        });
                    }
                }
                else {
                    // New x-mitre-collection object
                    if (options.previewOnly) {
                        // Do nothing
                        process.nextTick(() => callback4(null, importedCollection));
                    } else {
                        const options = { addObjectsToCollection: false, import: true };
                        collectionsService.create(importedCollection, options)
                            .then(function (result) {
                                return callback4(null, result.savedCollection);
                            })
                            .catch(function (err) {
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

async function createBundle(collection, options) {
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

    await addDerivedDataSources(bundle.objects);

    if (!options.previewOnly) {
        const exportData = {
            export_timestamp: new Date(),
            bundle_id: bundle.id
        }
        // Mark all of the objects as belonging to the bundle
        await collectionsService.insertExport(collection.stix.id, collection.stix.modified, exportData);
    }

    return bundle;
}

exports.exportBundle = async function(options) {
    if (options.collectionModified) {
        // Retrieve the collection with the provided id and modified date
        const retrievalOptions = { retrieveContents: true };
        const retrieveCollection = util.promisify(collectionsService.retrieveVersionById);
        const collection = await retrieveCollection(options.collectionId, options.collectionModified, retrievalOptions);
        if (collection) {
            const bundle = await createBundle(collection, options);
            return bundle;
        }
        else {
            const error = new Error(errors.notFound);
            throw error;
        }
    }
    else {
        // Retrieve the latest collection with the provided id
        const retrievalOptions = {
            versions: 'latest',
            retrieveContents: true
        };
        const retrieveCollection = util.promisify(collectionsService.retrieveById);
        const collections = await retrieveCollection(options.collectionId, retrievalOptions);
        if (collections.length === 1) {
            const exportedCollection = collections[0];
            const bundle = await createBundle(exportedCollection, options);
            return bundle;
        } else if (collections.length === 0) {
            const error = new Error(errors.notFound);
            throw error;
        } else {
            const error = new Error('Unknown error occurred');
            throw error;
        }
    }
}

async function addDerivedDataSources(bundleObjects) {
    // Get the data components, data sources, and techniques detected by data components
    const dataComponents = new Map();
    const dataSources = new Map();
    const techniqueDetectedBy = new Map();
    for (const bundleObject of bundleObjects) {
        if (bundleObject.type === 'x-mitre-data-component') {
            dataComponents.set(bundleObject.id, bundleObject);
        }
        else if (bundleObject.type === 'x-mitre-data-source') {
            dataSources.set(bundleObject.id, bundleObject);
        }
        else if (bundleObject.type === 'relationship' && bundleObject.relationship_type === 'detects') {
            // technique (target_ref) detected by array of data-component (source_ref)
            const dataComponents = techniqueDetectedBy.get(bundleObject.target_ref);
            if (dataComponents) {
                // Add to the existing array
                dataComponents.push(bundleObject.source_ref);
            }
            else {
                // Create a new array and add to map
                techniqueDetectedBy.set(bundleObject.target_ref, [bundleObject.source_ref]);
            }
        }
    }

    const icsDataSourceValues = await systemConfigurationService.retrieveAllowedValuesForTypePropertyDomain('technique', 'x_mitre_data_sources', 'ics-attack');
    for (const bundleObject of bundleObjects) {
        if (bundleObject.type === 'attack-pattern') {
            const enterpriseDomain = bundleObject.x_mitre_domains.find(domain => domain === 'enterprise-attack');
            const icsDomain = bundleObject.x_mitre_domains.find(domain => domain === 'attack-ics');
            if (enterpriseDomain && !icsDomain) {
                // Remove any existing data sources
                bundleObject.x_mitre_data_sources = [];

                // Add in any enterprise data sources from detects relationships
                const dataComponentIds = techniqueDetectedBy.get(bundleObject.id);
                if (dataComponentIds) {
                    for (const dataComponentId of dataComponentIds) {
                        const dataComponent = dataComponents.get(dataComponentId);
                        const dataSource = dataSources.get(dataComponent.x_mitre_data_source_ref);
                        const derivedDataSource = `${ dataSource.name }: ${ dataComponent.name }`;
                        bundleObject.x_mitre_data_sources.push(derivedDataSource);
                    }
                }
            }
            else if (icsDomain && !enterpriseDomain) {
                // Remove any data sources that are not in the list of valid ICS data sources
                bundleObject.x_mitre_data_sources = bundleObject.x_mitre_data_sources.filter(source => icsDataSourceValues.allowedValues.find(value => value === source));
            }
            else if (enterpriseDomain && icsDomain) {
                // Remove any data sources that are not in the list of valid ICS data sources
                bundleObject.x_mitre_data_sources = bundleObject.x_mitre_data_sources.filter(source => icsDataSourceValues.allowedValues.find(value => value === source));

                // Add in any enterprise data sources from detects relationships
                const dataComponentIds = techniqueDetectedBy.get(bundleObject.id);
                if (dataComponentIds) {
                    for (const dataComponentId of dataComponentIds) {
                        const dataComponent = dataComponents.get(dataComponentId);
                        const dataSource = dataSources.get(dataComponent.x_mitre_data_source_ref);
                        const derivedDataSource = `${ dataSource.name }: ${ dataComponent.name }`;
                        bundleObject.x_mitre_data_sources.push(derivedDataSource);
                    }
                }
            }
            else {
                // Remove any existing data sources
                bundleObject.x_mitre_data_sources = [];
            }
        }
    }
}
