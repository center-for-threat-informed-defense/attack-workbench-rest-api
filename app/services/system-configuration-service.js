'use strict';

const fs = require('fs');
const config = require('../config/config');

const SystemConfiguration = require('../models/system-configuration-model');
const Identity = require('../models/identity-model');
const UserAccount = require('../models/user-account-model');

let allowedValues;

const errors = {
    systemConfigurationDocumentNotFound: 'System configuration document not found',
    organizationIdentityNotFound: 'Organization identity not found',
    organizationIdentityNotSet: 'Organization identity not set',
    anonymousUserAccountNotFound: 'Anonymous user account not found',
    anonymousUserAccountNotSet: 'Anonymous user account not set'
};
exports.errors = errors;

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
    const systemConfig = await SystemConfiguration.findOne();

    if (systemConfig && systemConfig.organization_identity_ref) {
        return systemConfig.organization_identity_ref;
    }
    else {
        throw new Error(errors.organizationIdentityNotSet);
    }
}

exports.retrieveOrganizationIdentity = async function() {
    // There should be exactly one system configuration document
    const systemConfig = await SystemConfiguration.findOne();

    if (systemConfig && systemConfig.organization_identity_ref) {
        const identity = Identity.findOne({ 'stix.id': systemConfig.organization_identity_ref });
        if (identity) {
            return identity;
        }
        else {
            const error = new Error(errors.organizationIdentityNotFound)
            error.organizationIdentityRef = systemConfig.organization_identity_ref;
            throw error;
        }
    }
    else {
        throw new Error(errors.organizationIdentityNotSet);
    }
}

exports.setOrganizationIdentity = async function(stixId) {
    // There should be exactly one system configuration document
    const systemConfig = await SystemConfiguration.findOne();

    if (systemConfig) {
        // The document exists already. Set the identity reference.
        systemConfig.organization_identity_ref = stixId;
        await systemConfig.save();
    }
    else {
        // The document doesn't exist yet. Create a new one.
        const systemConfigData = {
            organization_identity_ref: stixId
        };
        const systemConfig = new SystemConfiguration(systemConfigData);
        await systemConfig.save();
    }
}

exports.retrieveAnonymousUserAccountId = async function() {
    // There should be exactly one system configuration document
    const systemConfig = await SystemConfiguration.findOne();

    if (systemConfig && systemConfig.anonymous_user_account_id) {
        return systemConfig.anonymous_user_account_id;
    }
    else {
        throw new Error(errors.anonymousUserAccountNotSet);
    }
}

exports.retrieveAnonymousUserAccount = async function() {
    // There should be exactly one system configuration document
    const systemConfig = await SystemConfiguration.findOne();

    if (systemConfig && systemConfig.anonymous_user_account_id) {
        const userAccount = await UserAccount.findOne({ 'id': systemConfig.anonymous_user_account_id });
        if (userAccount) {
            return userAccount;
        }
        else {
            const error = new Error(errors.anonymousUserAccountNotFound)
            error.anonymousUserAccountId = systemConfig.anonymous_user_account_id;
            throw error;
        }
    }
    else {
        throw new Error(errors.anonymousUserAccountNotSet);
    }
}

exports.setAnonymousUserAccountId = async function(userAccountId) {
    // There should be exactly one system configuration document
    const systemConfig = await SystemConfiguration.findOne();

    if (systemConfig) {
        // The document exists already. Set the anonymous user account id.
        systemConfig.anonymous_user_account_id = userAccountId;
        await systemConfig.save();
    }
    else {
        throw new Error(errors.systemConfigurationDocumentNotFound);
    }
}

exports.retrieveAuthenticationConfig = async function() {
    await SystemConfiguration.findOne();

    // We only support a one mechanism at a time, but may support multiples in the future,
    // so return an array of mechanisms
    const authenticationConfig = {
        mechanisms: [
            { authnType: config.authn.mechanism }
        ]
    };
    return authenticationConfig;
}
