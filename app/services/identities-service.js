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

exports.retrieveAll = attackObjectsService.makeRetrieveAllSync(
    Identity,
    addExtraDataToAll
);
exports.retrieveById = attackObjectsService.makeRetrieveByIdSync(
    Identity,
    addExtraData,
    addExtraDataToAll
);
exports.retrieveVersionById = attackObjectsService.makeRetrieveVersionByIdSync(
    Identity,
    addExtraData
);

function addExtraData(identity, options) {
    return Promise.resolve(identity);
}

function addExtraDataToAll(identities, options) {
    return Promise.resolve(identities);
}

exports.createIsAsync = true;
exports.create = async function (data, options) {
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

exports.updateFull = function (stixId, stixModified, data, callback) {
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

    Identity.findOne({ 'stix.id': stixId, 'stix.modified': stixModified }, function (err, document) {
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
            document.save(function (err, savedDocument) {
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

exports.deleteById = attackObjectsService.makeDeleteByIdSync(Identity);
exports.deleteVersionById = attackObjectsService.makeDeleteVersionByIdSync(Identity);

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

exports.addCreatedByAndModifiedByIdentitiesToAll = async function (attackObjects) {
    const identityCache = new Map();
    const userAccountCache = new Map();
    for (const attackObject of attackObjects) {
        // eslint-disable-next-line no-await-in-loop
        await addCreatedByAndModifiedByIdentities(attackObject, identityCache, userAccountCache);
    }
}
