'use strict';

const uuid = require('uuid');
const attackObjectsService = require('./attack-objects-service');
const config = require('../config/config');
const userAccountsService = require('./user-accounts-service');
const identitiesRepository = require('../repository/identities-repository');
const BaseService = require('./_base.service');
const { InvalidTypeError } = require('../exceptions');

const errors = {
    missingParameter: 'Missing required parameter',
    badlyFormattedParameter: 'Badly formatted parameter',
    duplicateId: 'Duplicate id',
    notFound: 'Document not found',
    invalidQueryStringParameter: 'Invalid query string parameter'
};
exports.errors = errors;

const identityType = 'identity';

class IdentitiesService extends BaseService {

    async addCreatedByAndModifiedByIdentitiesToAll(attackObjects) {
        const identityCache = new Map();
        const userAccountCache = new Map();
        for (const attackObject of attackObjects) {
            // eslint-disable-next-line no-await-in-loop
            await this.addCreatedByAndModifiedByIdentities(attackObject, identityCache, userAccountCache);
        }
    }
    
    async create(data, options) {
        // This function overrides the base class create() because
        //   1. It does not set the created_by_ref or x_mitre_modified_by_ref properties
        //   2. It does not check for an existing identity object

        if (data?.stix?.type !== identityType) {
            throw new InvalidTypeError();
        }

        options = options || {};
        if (!options.import) {
            // Set the ATT&CK Spec Version
            data.stix.x_mitre_attack_spec_version = data.stix.x_mitre_attack_spec_version ?? config.app.attackSpecVersion;

            // Record the user account that created the object
            if (options.userAccountId) {
                data.workspace.workflow.created_by_user_account = options.userAccountId;
            }

            // Set the default marking definitions
            await attackObjectsService.setDefaultMarkingDefinitions(data);

            // Assign a new STIX id if not already provided
            data.stix.id = data.stix.id || `identity--${uuid.v4()}`;
        }

        // Save the document in the database
        const savedIdentity = await this.repository.save(data);
        return savedIdentity;
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
                const identityObject = await this.repository.retrieveLatestByStixId(attackObject.stix.created_by_ref);
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
                const identityObject = await this.repository.retrieveLatestByStixId(attackObject.stix.x_mitre_modified_by_ref);
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

    static async addCreatedByUserAccountWithCache(attackObject, cache) {
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
            await this.addCreatedByIdentity(attackObject, identityCache);
        }

        if (attackObject && attackObject.stix && attackObject.stix.x_mitre_modified_by_ref) {
            await this.addModifiedByIdentity(attackObject, identityCache);
        }

        // Add user account data
        if (attackObject?.workspace?.workflow?.created_by_user_account) {
            await IdentitiesService.addCreatedByUserAccountWithCache(attackObject, userAccountCache);
        }
    }
}

module.exports = new IdentitiesService(identityType, identitiesRepository);