'use strict';

const uuid = require('uuid');
const Identity = require('../models/identity-model');
const attackObjectsService = require('./attack-objects-service');
const config = require('../config/config');
const userAccountsService = require('./user-accounts-service');
const identitiesRepository = require('../repository/identities-repository');

const errors = {
    missingParameter: 'Missing required parameter',
    badlyFormattedParameter: 'Badly formatted parameter',
    duplicateId: 'Duplicate id',
    notFound: 'Document not found',
    invalidQueryStringParameter: 'Invalid query string parameter'
};
exports.errors = errors;

class IdentitiesService extends BaseService {

    async getLatest(stixId) {
        const identity = await Identity
            .findOne({ 'stix.id': stixId })
            .sort('-stix.modified')
            .lean()
            .exec();

        return identity;
    }

    async addCreatedByIdentity(attackObject, cache) {
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

    async addModifiedByIdentity(attackObject, cache) {
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

    async addCreatedByUserAccountWithCache(attackObject, cache) {
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

    async addCreatedByAndModifiedByIdentities(attackObject, identityCache, userAccountCache) {
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

    async addCreatedByAndModifiedByIdentitiesToAll(attackObjects) {
        const identityCache = new Map();
        const userAccountCache = new Map();
        for (const attackObject of attackObjects) {
            // eslint-disable-next-line no-await-in-loop
            await addCreatedByAndModifiedByIdentities(attackObject, identityCache, userAccountCache);
        }
    }

}

module.exports = new IdentitiesService('x-mitre-identity', identitiesRepository);