'use strict';

const fs = require('fs');
const config = require('../config/config');
const systemConfigurationRepository = require('../repository/system-configurations-repository');
const userAccountsService = require('./user-accounts-service');
const {
    SystemConfigurationNotFound,
    OrganizationIdentityNotSetError,
    OrganizationIdentityNotFoundError,
    DefaultMarkingDefinitionsNotFoundError,
    AnonymousUserAccountNotSetError,
    AnonymousUserAccountNotFoundError } = require('../exceptions');

let allowedValues;
let markingDefinitionsService;
let identitiesService;

// NOTE: Some parts of the system configuration are stored in the systemconfiguration collection in the database
//   (the systemconfiguration collection should have exactly one document)
// Other parts of the system configuration are read from the config module (which is prepared at start-up
//   based on environment variables and an optional configuration file)

exports.retrieveSystemVersion = function() {
    const systemVersionInfo = {
        version: config.app.version,
        attackSpecVersion: config.app.attackSpecVersion
    };

    return systemVersionInfo;
}

async function retrieveAllowedValues() {
    if (allowedValues) {
        return allowedValues;
    }
    else {
        const data = await fs.promises.readFile(config.configurationFiles.allowedValues);
        allowedValues = JSON.parse(data);
        return allowedValues;
    }
}
exports.retrieveAllowedValues = retrieveAllowedValues;

async function retrieveAllowedValuesForType(objectType) {
    const values = await retrieveAllowedValues();

    return values.find(element => element.objectType === objectType);
}
exports.retrieveAllowedValuesForType = retrieveAllowedValuesForType;

async function retrieveAllowedValuesForTypeAndProperty(type, propertyName) {
    const values = await retrieveAllowedValuesForType(type);

    return values?.properties.find(element => element.propertyName === propertyName);
}
exports.retrieveAllowedValuesForTypeAndProperty = retrieveAllowedValuesForTypeAndProperty;

async function retrieveAllowedValuesForTypePropertyDomain(objectType, propertyName, domainName) {
    const values = await retrieveAllowedValuesForTypeAndProperty(objectType, propertyName);

    return values?.domains.find(element => element.domainName === domainName);
}
exports.retrieveAllowedValuesForTypePropertyDomain = retrieveAllowedValuesForTypePropertyDomain;

exports.retrieveOrganizationIdentityRef = async function() {
    // There should be exactly one system configuration document
    const systemConfig = await systemConfigurationRepository.retrieveOne();

    if (systemConfig && systemConfig.organization_identity_ref) {
        return systemConfig.organization_identity_ref;
    }
    else {
        throw new OrganizationIdentityNotSetError;
    }
}

exports.retrieveOrganizationIdentity = async function() {
    if (!identitiesService) {
        identitiesService = require('./identities-service');
    }
    // There should be exactly one system configuration document
    const systemConfig = await systemConfigurationRepository.retrieveOne({ lean: true });

    if (systemConfig && systemConfig.organization_identity_ref) {
        const identities = await identitiesService.retrieveById(systemConfig.organization_identity_ref, { versions: 'latest' });
        if (identities.length === 1) {
            return identities[0];
        }
        else {
            throw new OrganizationIdentityNotFoundError(systemConfig.organization_identity_ref);
        }
    }
    else {
        throw new OrganizationIdentityNotSetError;
    }
}

exports.setOrganizationIdentity = async function(stixId) {
    // There should be exactly one system configuration document
    const systemConfig = await systemConfigurationRepository.retrieveOne();

    if (systemConfig) {
        // The document exists already. Set the identity reference.
        systemConfig.organization_identity_ref = stixId;
        await systemConfigurationRepository.constructor.saveDocument(systemConfig);
    }
    else {
        // The document doesn't exist yet. Create a new one.
        const systemConfigData = {
            organization_identity_ref: stixId
        };
        const systemConfig = systemConfigurationRepository.createNewDocument(systemConfigData);
        await systemConfigurationRepository.constructor.saveDocument(systemConfig);
    }
}

exports.retrieveDefaultMarkingDefinitions = async function(options) {
    if (!markingDefinitionsService) {
        markingDefinitionsService = require('./marking-definitions-service');
    }
    options = options ?? {};

    // There should be exactly one system configuration document
    const systemConfig = await systemConfigurationRepository.retrieveOne({ lean: true });

    if (systemConfig) {
        if (systemConfig.default_marking_definitions) {
            if (options.refOnly) {
                return systemConfig.default_marking_definitions;
            }
            else {
                const defaultMarkingDefinitions = [];
                for (const stixId of systemConfig.default_marking_definitions) {
                    // eslint-disable-next-line no-await-in-loop
                    const markingDefinition = await markingDefinitionsService.retrieveById(stixId);
                    if (markingDefinition.length === 1) {
                        defaultMarkingDefinitions.push(markingDefinition[0]);
                    }
                    else {
                        throw new DefaultMarkingDefinitionsNotFoundError;
                    }
                }
                return defaultMarkingDefinitions;
            }
        }
        else {
            // default_marking_definitions not set
            return [];
        }
    }
    else {
        // No system config
        return [];
    }
}

exports.setDefaultMarkingDefinitions = async function(stixIds) {
    // There should be exactly one system configuration document
    const systemConfig = await systemConfigurationRepository.retrieveOne();

    if (systemConfig) {
        // The document exists already. Set the default marking definitions.
        systemConfig.default_marking_definitions = stixIds;
        await systemConfigurationRepository.constructor.saveDocument(systemConfig);
    }
    else {
        // The document doesn't exist yet. Create a new one.
        const systemConfigData = {
            default_marking_definitions: stixIds
        };
        const systemConfig = systemConfigurationRepository.createNewDocument(systemConfigData);
        await systemConfigurationRepository.constructor.saveDocument(systemConfig);
    }
}

exports.retrieveAnonymousUserAccount = async function() {
    // There should be exactly one system configuration document
    const systemConfig = await systemConfigurationRepository.retrieveOne({ lean: true });

    if (systemConfig && systemConfig.anonymous_user_account_id) {
        const userAccount = await userAccountsService.retrieveById(systemConfig.anonymous_user_account_id, {});
        if (userAccount) {
            return userAccount;
        }
        else {
            throw new AnonymousUserAccountNotFoundError(systemConfig.anonymous_user_account_id);
        }
    }
    else {
        throw new AnonymousUserAccountNotSetError;
    }
}

exports.setAnonymousUserAccountId = async function(userAccountId) {
    // There should be exactly one system configuration document
    const systemConfig = await systemConfigurationRepository.retrieveOne();

    if (systemConfig) {
        // The document exists already. Set the anonymous user account id.
        systemConfig.anonymous_user_account_id = userAccountId;
        await systemConfigurationRepository.constructor.saveDocument(systemConfig);
    }
    else {
        throw new SystemConfigurationNotFound;
    }
}

exports.retrieveAuthenticationConfig = function() {
    // We only support a one mechanism at a time, but may support multiples in the future,
    // so return an array of mechanisms
    const authenticationConfig = {
        mechanisms: [
            { authnType: config.userAuthn.mechanism }
        ]
    };
    return authenticationConfig;
}

exports.retrieveOrganizationNamespace = async function() {
    // There should be exactly one system configuration document
    const systemConfig = await systemConfigurationRepository.retrieveOne({ lean: true });

    if (systemConfig) {
        return systemConfig.organization_namespace;
    }
    else {
        throw new SystemConfigurationNotFound;
    }
}

exports.setOrganizationNamespace = async function(namespace) {
    // There should be exactly one system configuration document
    const systemConfig = await systemConfigurationRepository.retrieveOne();

    if (systemConfig) {
        systemConfig.organization_namespace = namespace;
        await systemConfigurationRepository.constructor.saveDocument(systemConfig);
    }
    else {
        throw new SystemConfigurationNotFound;
    }
}
