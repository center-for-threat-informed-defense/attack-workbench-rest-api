'use strict';

const identitiesService = require('../services/identities-service');
const userAccountsService = require('../services/user-accounts-service');
const systemConfigurationService = require('../services/system-configuration-service');
const logger = require('../lib/logger');

async function createPlaceholderOrganizationIdentity() {
    // Create placeholder identity object
    const timestamp = new Date().toISOString();
    const placeholderIdentity = {
        workspace: {
            workflow: {
                state: 'awaiting-review'
            }
        },
        stix: {
            created: timestamp,
            modified: timestamp,
            name: 'Placeholder Organization Identity',
            identity_class: 'organization',
            spec_version: '2.1',
            type: 'identity',
            description: 'This is a placeholder organization identity. Please edit it or replace it with another identity.'
        }
    };

    try {
        const newIdentity = await identitiesService.create(placeholderIdentity, { import: false });

        // Set the organization identity to the placeholder identity
        await systemConfigurationService.setOrganizationIdentity(newIdentity.stix.id);
        logger.info(`Organization identity set to placeholder identity with id: ${ newIdentity.stix.id }`);
    }
    catch(err) {
        logger.error('Unable to create or set placeholder organization identity: ' + err);
        throw err;
    }
}

async function createAnonymousUserAccount() {
    // Create the anonymous user account
    const anonymousUserAccount = {
        email: null,
        username: 'anonymous',
        status: 'active',
        role: 'admin'
    };

    try {
        const newUserAccount = await userAccountsService.create(anonymousUserAccount);

        // Set the anonymous user account id to the new user account id
        await systemConfigurationService.setAnonymousUserAccountId(newUserAccount.id);
        logger.info(`Anonymous user account set to user account with id: ${ newUserAccount.id }`);
    }
    catch(err) {
        logger.error('Unable to create or set anonymous user account: ' + err);
        throw err;
    }
}

async function checkForOrganizationIdentity() {
    try {
        const identity = await systemConfigurationService.retrieveOrganizationIdentity();
        logger.info(`Success: Organization identity is set to ${ identity.stix.name }`);
    }
    catch(err) {
        if (err.message === systemConfigurationService.errors.organizationIdentityNotFound) {
            logger.warn(`Organization identity with id ${ err.organizationIdentityRef } not found, setting to placeholder identity`);
            await createPlaceholderOrganizationIdentity();
        }
        else if (err.message === systemConfigurationService.errors.organizationIdentityNotSet) {
            logger.warn(`Organization identity not set, setting to placeholder identity`);
            await createPlaceholderOrganizationIdentity();
        }
        else {
            logger.error("Unable to retrieve organization identity, failed with error: " + err);
            logger.warn(`Attempting to set organization identity to placeholder identity`);
            await createPlaceholderOrganizationIdentity();
        }
    }
}

async function checkForAnonymousUserAccount() {
    const config = require('../config/config');

    // Only check for an anonymous user account if the system has been configured to use the anonymous authn mechanism
    if (config.authn.mechanism === 'anonymous') {
        try {
            const anonymousUserAccount = await systemConfigurationService.retrieveAnonymousUserAccount();
            logger.info(`Success: Anonymous user account is set to ${ anonymousUserAccount.id }`);
        }
        catch(err) {
            if (err.message === systemConfigurationService.errors.anonymousUserAccountNotFound) {
                logger.warn(`Anonymous user account with id ${ err.anonymousUserAccountId } not found, creating new anonymous user account`);
                await createAnonymousUserAccount();
            }
            else if (err.message === systemConfigurationService.errors.anonymousUserAccountNotSet) {
                logger.warn(`Anonymous user account not set, creating new anonymous user account`);
                await createAnonymousUserAccount();
            }
            else {
                logger.error("Unable to retrieve anonymous user account, failed with error: " + err);
                logger.warn(`Attempting to create new anonymous user account`);
                await createAnonymousUserAccount();
            }
        }
    }
}

exports.checkSystemConfiguration = async function() {
    logger.info(`Performing system configuration check...`);
    await checkForOrganizationIdentity();
    await checkForAnonymousUserAccount();
}
