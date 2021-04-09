'use strict';

const identitiesService = require('../services/identities-service');
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
        const newIdentity = await identitiesService.createAsync(placeholderIdentity);

        // Set the organization identity to the placeholder identity
        await systemConfigurationService.setOrganizationIdentity(newIdentity.stix.id);
        logger.info(`Organization identity set to placeholder identity with id: ${ newIdentity.stix.id }`);
    }
    catch(err) {
        logger.error('Unable to create or set placeholder organization identity: ' + err);
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

exports.checkSystemConfiguration = async function() {
    logger.info(`Performing system configuration check...`);
    await checkForOrganizationIdentity();
}
