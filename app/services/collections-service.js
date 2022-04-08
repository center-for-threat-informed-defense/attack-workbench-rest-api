'use strict';

const uuid = require('uuid');
const asyncLib = require('async');

const Collection = require('../models/collection-model');
const AttackObject = require('../models/attack-object-model');
const systemConfigurationService = require('./system-configuration-service');
const attackObjectsService = require('./attack-objects-service');
const identitiesService = require('./identities-service');
const config = require('../config/config');
const regexValidator = require('../lib/regex');

const errors = {
    missingParameter: 'Missing required parameter',
    badlyFormattedParameter: 'Badly formatted parameter',
    duplicateId: 'Duplicate id',
    notFound: 'Document not found',
    invalidQueryStringParameter: 'Invalid query string parameter'
};
exports.errors = errors;

exports.retrieveAll = function(options, callback) {
    // Build the query
    const query = {};
    if (!options.includeRevoked) {
        query['stix.revoked'] = { $in: [null, false] };
    }
    if (!options.includeDeprecated) {
        query['stix.x_mitre_deprecated'] = { $in: [null, false] };
    }
    if (typeof options.state !== 'undefined') {
        if (Array.isArray(options.state)) {
            query['workspace.workflow.state'] = { $in: options.state };
        }
        else {
            query['workspace.workflow.state'] = options.state;
        }
    }

    // Build the aggregation
    const aggregation = [ { $sort: { 'stix.id': 1, 'stix.modified': 1 }} ];
    if (options.versions === 'latest') {
        // Group the documents by stix.id, sorted by stix.modified
        // Use the last document in each group (according to the value of stix.modified)
        // Then sort again since the $group does not retain the sort order
        aggregation.push({ $group: { _id: '$stix.id', document: { $last: '$$ROOT' }}});
        aggregation.push({ $replaceRoot: { newRoot: '$document' }});
        aggregation.push({ $sort: { 'stix.id': 1 }});
    }

    // Apply query, skip and limit options
    aggregation.push({ $match: query });

    if (typeof options.search !== 'undefined') {
        options.search = regexValidator.sanitizeRegex(options.search);
        const match = { $match: { $or: [
                    { 'stix.name': { '$regex': options.search, '$options': 'i' }},
                    { 'stix.description': { '$regex': options.search, '$options': 'i' }}
                ]}};
        aggregation.push(match);
    }

    if (options.skip) {
        aggregation.push({ $skip: options.skip });
    }
    if (options.limit) {
        aggregation.push({ $limit: options.limit });
    }

    // Retrieve the documents
    Collection.aggregate(aggregation, function(err, collections) {
        if (err) {
            return callback(err);
        }
        else {
            identitiesService.addCreatedByAndModifiedByIdentitiesToAll(collections)
                .then(function() {
                    return callback(null, collections);
                });
        }
    });
};

function getContents(objectList, callback) {
    asyncLib.mapLimit(
        objectList,
        5,
        async function(objectRef) {
            const attackObject = await attackObjectsService.retrieveVersionById(objectRef.object_ref, objectRef.object_modified);
            return attackObject;
        },
        function(err, results) {
            if (err) {
                return callback(err);
            }
            else {
                const filteredResults = results.filter(item => item);
                return callback(null, filteredResults);
            }
        });
}

exports.retrieveById = function(stixId, options, callback) {
    // versions=all Retrieve all collections with the stixId
    // versions=latest Retrieve the collection with the latest modified date for this stixId
    if (!stixId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'stixId';
        return callback(error);
    }

    if (options.versions === 'all') {
        Collection.find({'stix.id': stixId})
            .lean()
            .exec(function (err, collections) {
                if (err) {
                    if (err.name === 'CastError') {
                        const error = new Error(errors.badlyFormattedParameter);
                        error.parameterName = 'stixId';
                        return callback(error);
                    }
                    else {
                        return callback(err);
                    }
                }
                else {
                    if (options.retrieveContents) {
                        asyncLib.eachSeries(
                            collections,
                            function(collection, callback2) {
                                getContents(collection.stix.x_mitre_contents, function (err, contents) {
                                    if (err) {
                                        return callback2(err);
                                    } else {
                                        collection.contents = contents;
                                        return callback2(null);
                                    }
                                })
                            },
                            function(err, results) {
                                if (err) {
                                    return callback(err);
                                }
                                else {
                                    return callback(null, collections);
                                }
                            });
                    }
                    else {
                        return callback(null, collections);
                    }
                }
            });
    }
    else if (options.versions === 'latest') {
        Collection.findOne({ 'stix.id': stixId })
            .sort('-stix.modified')
            .lean()
            .exec(function(err, collection) {
                if (err) {
                    if (err.name === 'CastError') {
                        const error = new Error(errors.badlyFormattedParameter);
                        error.parameterName = 'stixId';
                        return callback(error);
                    }
                    else {
                        return callback(err);
                    }
                }
                else {
                    // Note: document is null if not found
                    if (collection) {
                        if (options.retrieveContents) {
                            getContents(collection.stix.x_mitre_contents, function (err, contents) {
                                if (err) {
                                    return callback(err);
                                } else {
                                    collection.contents = contents;
                                    return callback(null, [ collection ]);
                                }
                            })
                        }
                        else {
                            return callback(null, [ collection ]);
                        }
                    }
                    else {
                        return callback(null, []);
                    }
                }
            });
    }
    else {
        const error = new Error(errors.invalidQueryStringParameter);
        error.parameterName = 'versions';
        return callback(error);
    }
};

exports.retrieveVersionById = function(stixId, modified, options, callback) {
    // Retrieve the versions of the collection with the matching stixID and modified date

    if (!stixId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'stixId';
        return callback(error);
    }

    if (!modified) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'modified';
        return callback(error);
    }

    Collection.findOne({ 'stix.id': stixId, 'stix.modified': modified })
        .lean()
        .exec(function(err, collection) {
            if (err) {
                if (err.name === 'CastError') {
                    const error = new Error(errors.badlyFormattedParameter);
                    error.parameterName = 'stixId';
                    return callback(error);
                }
                else {
                    return callback(err);
                }
            }
            else {
                if (collection) {
                    if (options.retrieveContents) {
                        getContents(collection.stix.x_mitre_contents, function (err, contents) {
                            if (err) {
                                return callback(err);
                            } else {
                                collection.contents = contents;
                                identitiesService.addCreatedByAndModifiedByIdentities(collection)
                                    .then(() => callback(null, collection));
                            }
                        })
                    } 
                    else {
                        identitiesService.addCreatedByAndModifiedByIdentities(collection)
                            .then(() => callback(null, collection));
                    }
                }
                else {
                    console.log('** NOT FOUND')
                    return callback();
                }
            }
        })
}

async function addObjectsToCollection(objectList, collectionID, collectionModified) {
    // Modify the objects in the collection to show that they are part of the collection
    const insertionErrors = [];
    for (const attackObject of objectList) {
        try {
            // eslint-disable-next-line no-await-in-loop
            await attackObjectsService.insertCollection(attackObject.object_ref, attackObject.object_modified, collectionID, collectionModified);
        }
        catch(err) {
            insertionErrors.push(err);
        }
    }

    return insertionErrors;
}

exports.createIsAsync = true;
exports.create = async function(data, options) {
    // Create the document
    const collection = new Collection(data);

    options = options || {};
    if (!options.import) {
        // Set the ATT&CK Spec Version
        collection.stix.x_mitre_attack_spec_version = collection.stix.x_mitre_attack_spec_version ?? config.app.attackSpecVersion;

        // Record the user account that created the object
        if (options.userAccountId) {
            collection.workspace.workflow.created_by_user_account = options.userAccountId;
        }

        // Set the default marking definitions
        await attackObjectsService.setDefaultMarkingDefinitions(collection);

        // Get the organization identity
        const organizationIdentityRef = await systemConfigurationService.retrieveOrganizationIdentityRef();

        // Check for an existing object
        let existingObject;
        if (collection.stix.id) {
            existingObject = await Collection.findOne({ 'stix.id': collection.stix.id });
        }

        if (existingObject) {
            // New version of an existing object
            // Only set the x_mitre_modified_by_ref property
            collection.stix.x_mitre_modified_by_ref = organizationIdentityRef;
        }
        else {
            // New object
            // Assign a new STIX id if not already provided
            collection.stix.id = collection.stix.id || `x-mitre-collection--${uuid.v4()}`;

            // Set the created_by_ref and x_mitre_modified_by_ref properties
            collection.stix.created_by_ref = organizationIdentityRef;
            collection.stix.x_mitre_modified_by_ref = organizationIdentityRef;
        }
    }

    // Save the document in the database
    let insertionErrors = [];
    try {
        const savedCollection = await collection.save();

        if (options.addObjectsToCollection) {
            insertionErrors = await addObjectsToCollection(savedCollection.stix.x_mitre_contents, savedCollection.stix.id, savedCollection.stix.modified);
        }

        return { savedCollection, insertionErrors };
    }
    catch (err) {
        if (err.name === 'MongoError' && err.code === 11000) {
            // 11000 = Duplicate index
            const error = new Error(errors.duplicateId);
            throw error;
        }
        else {
            throw err;
        }
    }
};

exports.delete = function (stixId, deleteAllContents, callback) {
    if (!stixId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'stixId';
        return callback(error);
    }

    Collection.find({'stix.id': stixId})
        .lean()
        .exec(function (err, collections) {
            if (err) {
                if (err.name === 'CastError') {
                    const error = new Error(errors.badlyFormattedParameter);
                    error.parameterName = 'stixId';
                    return callback(error);
                }
                else {
                    return callback(err);
                }
            }
            else {
                const removedCollections = [];
                asyncLib.each(collections, function(collection, callback2) {
                        if (deleteAllContents) {
                            asyncLib.each(collection.stix.x_mitre_contents, function(reference, callback2a) {
                                AttackObject.findOneAndRemove({ 'stix.id': reference.object_ref, 'stix.modified': reference.object_modified }, function(err, object) {
                                    if (err) {
                                        return callback2a(err);
                                    }
                                    else {
                                        return callback2a();
                                    }
                                });
                            });
                        }

                        Collection.findOneAndRemove({ 'stix.id': collection.stix.id, 'stix.modified': collection.stix.modified }, function (err, collection) {
                            if (err) {
                                return callback2(err);
                            } else {
                                //Note: collection is null if not found
                                if (collection) {
                                    removedCollections.push(collection)
                                }
                                return callback2(null, collection);
                            }
                        });
                    },
                    function(err, results) {
                        if (err) {
                            return callback(err);
                        }
                        else {
                            return callback(null, removedCollections);
                        }
                    });
            }
        });
};

exports.insertExport = async function(stixId, modified, exportData) {
    const collection = await Collection.findOne({ 'stix.id': stixId, 'stix.modified': modified });

    if (collection) {
        // Make sure the exports array exists
        if (!collection.workspace.exported) {
            collection.workspace.exported = [];
        }
        collection.workspace.exported.push(exportData);

        await collection.save();
    }
    else {
        throw new Error(errors.notFound);
    }
};
