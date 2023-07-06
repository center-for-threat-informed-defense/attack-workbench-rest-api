'use strict';

const uuid = require('uuid');
const Identity = require('../models/identity-model');
const attackObjectsService = require('./attack-objects-service');
const config = require('../config/config');
const userAccountsService = require('./user-accounts-service');

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
    // - Group the documents by stix.id, sorted by stix.modified
    // - Use the last document in each group (according to the value of stix.modified)
    // - Then apply query, skip and limit options
    const aggregation = [
        { $sort: { 'stix.id': 1, 'stix.modified': 1 } },
        { $group: { _id: '$stix.id', document: { $last: '$$ROOT' }}},
        { $replaceRoot: { newRoot: '$document' }},
        { $sort: { 'stix.id': 1 }},
        { $match: query }
    ];

    const facet = {
        $facet: {
            totalCount: [ { $count: 'totalCount' }],
            documents: [ ]
        }
    };
    if (options.offset) {
        facet.$facet.documents.push({ $skip: options.offset });
    }
    else {
        facet.$facet.documents.push({ $skip: 0 });
    }
    if (options.limit) {
        facet.$facet.documents.push({ $limit: options.limit });
    }
    aggregation.push(facet);

    // Retrieve the documents
    Identity.aggregate(aggregation, function(err, results) {
        if (err) {
            return callback(err);
        }
        else {
            if (options.includePagination) {
                let derivedTotalCount = 0;
                if (results[0].totalCount.length > 0) {
                    derivedTotalCount = results[0].totalCount[0].totalCount;
                }
                const returnValue = {
                    pagination: {
                        total: derivedTotalCount,
                        offset: options.offset,
                        limit: options.limit
                    },
                    data: results[0].documents
                };
                return callback(null, returnValue);
            }
            else {
                return callback(null, results[0].documents);
            }
        }
    });
};

exports.retrieveById = function(stixId, options, callback) {
    // versions=all Retrieve all identities with the stixId
    // versions=latest Retrieve the identity with the latest modified date for this stixId

    if (!stixId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'stixId';
        return callback(error);
    }

    if (options.versions === 'all') {
        Identity.find({'stix.id': stixId})
            .sort('-stix.modified')
            .lean()
            .exec(function (err, identities) {
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
                    return callback(null, identities);
                }
            });
    }
    else if (options.versions === 'latest') {
        Identity.findOne({ 'stix.id': stixId })
            .sort('-stix.modified')
            .lean()
            .exec(function(err, identity) {
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
                    if (identity) {
                        return callback(null, [ identity ]);
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

exports.retrieveVersionById = function(stixId, modified, callback) {
    // Retrieve the versions of the identity with the matching stixId and modified date

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

    Identity.findOne({ 'stix.id': stixId, 'stix.modified': modified }, function(err, identity) {
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
            if (identity) {
                return callback(null, identity);
            }
            else {
                return callback();
            }
        }
    });
};

exports.createIsAsync = true;
exports.create = async function(data, options) {
    // This function handles two use cases:
    //   1. This is a completely new object. Create a new object and generate the stix.id if not already
    //      provided.
    //   2. This is a new version of an existing object. Create a new object with the specified id.
    //   Do not set the created_by_ref or x_mitre_modified_by_ref properties.

    // Create the document
    const identity = new Identity(data);

    options = options || {};
    if (!options.import) {
        // Set the ATT&CK Spec Version
        identity.stix.x_mitre_attack_spec_version = identity.stix.x_mitre_attack_spec_version ?? config.app.attackSpecVersion;

        // Record the user account that created the object
        if (options.userAccountId) {
            identity.workspace.workflow.created_by_user_account = options.userAccountId;
        }

        // Set the default marking definitions
        await attackObjectsService.setDefaultMarkingDefinitions(identity);

        // Assign a new STIX id if not already provided
        identity.stix.id = identity.stix.id || `identity--${uuid.v4()}`;
    }

    // Save the document in the database
    try {
        const savedIdentity = await identity.save();
        return savedIdentity;
    }
    catch (err) {
        if (err.name === 'MongoServerError' && err.code === 11000) {
            // 11000 = Duplicate index
            const error = new Error(errors.duplicateId);
            throw error;
        }
        else {
            throw err;
        }
    }
};

exports.updateFull = function(stixId, stixModified, data, callback) {
    if (!stixId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'stixId';
        return callback(error);
    }

    if (!stixModified) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'modified';
        return callback(error);
    }

    Identity.findOne({ 'stix.id': stixId, 'stix.modified': stixModified }, function(err, document) {
        if (err) {
            if (err.name === 'CastError') {
                var error = new Error(errors.badlyFormattedParameter);
                error.parameterName = 'stixId';
                return callback(error);
            }
            else {
                return callback(err);
            }
        }
        else if (!document) {
            // document not found
            return callback(null);
        }
        else {
            // Copy data to found document and save
            Object.assign(document, data);
            document.save(function(err, savedDocument) {
                if (err) {
                    if (err.name === 'MongoServerError' && err.code === 11000) {
                        // 11000 = Duplicate index
                        var error = new Error(errors.duplicateId);
                        return callback(error);
                    }
                    else {
                        return callback(err);
                    }
                }
                else {
                    return callback(null, savedDocument);
                }
            });
        }
    });
};

exports.deleteVersionById = function (stixId, stixModified, callback) {
    if (!stixId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'stixId';
        return callback(error);
    }

    if (!stixModified) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'modified';
        return callback(error);
    }

    Identity.findOneAndRemove({ 'stix.id': stixId, 'stix.modified': stixModified }, function (err, identity) {
        if (err) {
            return callback(err);
        } else {
            //Note: identity is null if not found
            return callback(null, identity);
        }
    });
};

exports.deleteById = function (stixId, callback) {
    if (!stixId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'stixId';
        return callback(error);
    }

    Identity.deleteMany({ 'stix.id': stixId }, function (err, identity) {
        if (err) {
            return callback(err);
        } else {
            //Note: identity is null if not found
            return callback(null, identity);
        }
    });
};

async function getLatest(stixId) {
    const identity = await Identity
        .findOne({ 'stix.id': stixId })
        .sort('-stix.modified')
        .lean()
        .exec();

    return identity;
}

async function addCreatedByIdentity(attackObject, cache) {
    // Use the cache if the caller provides one
    if (cache) {
        const identityObject = cache.get(attackObject.stix.created_by_ref);
        if (identityObject) {
            attackObject.created_by_identity = identityObject;
        }
    }

    if (!attackObject.created_by_identity) {
        // No cache or not found in cache
        try {
            // eslint-disable-next-line require-atomic-updates
            const identityObject = await getLatest(attackObject.stix.created_by_ref);
            attackObject.created_by_identity = identityObject;

            if (cache) {
                cache.set(attackObject.stix.created_by_ref, identityObject);
            }
        }
        catch (err) {
            // Ignore lookup errors
        }
    }
}

async function addModifiedByIdentity(attackObject, cache) {
    // Use the cache if the caller provides one
    if (cache) {
        const identityObject = cache.get(attackObject.stix.x_mitre_modified_by_ref);
        if (identityObject) {
            attackObject.modified_by_identity = identityObject;
        }
    }

    if (!attackObject.modified_by_identity) {
        // No cache or not found in cache
        try {
            // eslint-disable-next-line require-atomic-updates
            const identityObject = await getLatest(attackObject.stix.x_mitre_modified_by_ref);
            attackObject.modified_by_identity = identityObject;

            if (cache) {
                cache.set(attackObject.stix.x_mitre_modified_by_ref, identityObject);
            }
        }
        catch (err) {
            // Ignore lookup errors
        }
    }
}

async function addCreatedByUserAccountWithCache(attackObject, cache) {
    const userAccountRef = attackObject?.workspace?.workflow?.created_by_user_account;
    if (userAccountRef) {
        // Use the cache if the caller provides one
        if (cache) {
            const userAccountObject = cache.get(userAccountRef);
            if (userAccountObject) {
                attackObject.created_by_user_account = userAccountObject;
            }
        }

        if (!attackObject.created_by_user_account) {
            // No cache or not found in cache
            await userAccountsService.addCreatedByUserAccount(attackObject);
            if (cache) {
                cache.set(userAccountRef, attackObject.created_by_user_account);
            }
        }
    }
}

async function addCreatedByAndModifiedByIdentities(attackObject, identityCache, userAccountCache) {
    if (attackObject && attackObject.stix && attackObject.stix.created_by_ref) {
        await addCreatedByIdentity(attackObject, identityCache);
    }

    if (attackObject && attackObject.stix && attackObject.stix.x_mitre_modified_by_ref) {
        await addModifiedByIdentity(attackObject, identityCache);
    }

    // Add user account data
    if (attackObject?.workspace?.workflow?.created_by_user_account) {
        await addCreatedByUserAccountWithCache(attackObject, userAccountCache);
    }
}
exports.addCreatedByAndModifiedByIdentities = addCreatedByAndModifiedByIdentities;

exports.addCreatedByAndModifiedByIdentitiesToAll = async function(attackObjects) {
    const identityCache = new Map();
    const userAccountCache = new Map();
    for (const attackObject of attackObjects) {
        // eslint-disable-next-line no-await-in-loop
        await addCreatedByAndModifiedByIdentities(attackObject, identityCache, userAccountCache);
    }
}
