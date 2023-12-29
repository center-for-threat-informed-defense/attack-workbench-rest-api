'use strict';

const uuid = require('uuid');
const Identity = require('../models/identity-model');
const attackObjectsService = require('./attack-objects-service');
const config = require('../config/config');
const userAccountsService = require('./user-accounts-service');
const identitiesRepository = require('../repository/identities-repository');
const BaseService = require('./_base.service');
const { DuplicateIdError, MissingParameterError, BadlyFormattedParameterError } = require('../exceptions');

const errors = {
    missingParameter: 'Missing required parameter',
    badlyFormattedParameter: 'Badly formatted parameter',
    duplicateId: 'Duplicate id',
    notFound: 'Document not found',
    invalidQueryStringParameter: 'Invalid query string parameter'
};
exports.errors = errors;

class IdentitiesService extends BaseService {

    async retrieveVersionById (stixId, modified) {
        // Retrieve the versions of the identity with the matching stixId and modified date
    
        if (!stixId) {
            throw new MissingParameterError;
        }
    
        if (!modified) {
            throw new MissingParameterError;
        }
    
        try {
            const identity = await Identity.findOne({ 'stix.id': stixId, 'stix.modified': modified }).exec();
    
            // Note: document is null if not found
            return identity || null;
        } catch (err) {
            if (err.name === 'CastError') {
                throw new BadlyFormattedParameterError;
            } else {
                throw err;
            }
        }
    };

    async deleteVersionById(stixId, stixModified) {
        if (!stixId) {
            throw new MissingParameterError;
        }
    
        if (!stixModified) {
            throw new MissingParameterError;
        }
    
        try {
            const identity = await Identity.findOneAndRemove({ 'stix.id': stixId, 'stix.modified': stixModified }).exec();
    
            // Note: identity is null if not found
            return identity || null;
        } catch (err) {
            throw err;
        }
    };
    
    

    createIsAsync = true;
    async create(data, options) {
        // This function handles two use cases:
        //   1. This is a completely new object. Create a new object and generate the stix.id if not already
        //      provided.
        //   2. This is a new version of an existing object. Create a new object with the specified id.
        //   Do not set the created_by_ref or x_mitre_modified_by_ref properties.

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
        try {
            const savedIdentity = await identitiesRepository.save(data);
            return savedIdentity;
        }
        catch (err) {
            if (err.name === 'MongoServerError' && err.code === 11000) {
                throw new DuplicateIdError;
            }
            else {
                throw err;
            }
        }
    };

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
            await this.addCreatedByIdentity(attackObject, identityCache);
        }

        if (attackObject && attackObject.stix && attackObject.stix.x_mitre_modified_by_ref) {
            await this.addModifiedByIdentity(attackObject, identityCache);
        }

        // Add user account data
        if (attackObject?.workspace?.workflow?.created_by_user_account) {
            await this.addCreatedByUserAccountWithCache(attackObject, userAccountCache);
        }
    }

    async addCreatedByAndModifiedByIdentitiesToAll(attackObjects) {
        const identityCache = new Map();
        const userAccountCache = new Map();
        for (const attackObject of attackObjects) {
            // eslint-disable-next-line no-await-in-loop
            await this.addCreatedByAndModifiedByIdentities(attackObject, identityCache, userAccountCache);
        }
    }

}

module.exports = new IdentitiesService('identity', identitiesRepository);