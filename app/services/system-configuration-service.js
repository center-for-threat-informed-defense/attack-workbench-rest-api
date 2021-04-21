'use strict';

const fs = require('fs');
const config = require('../config/config');

const SystemConfiguration = require('../models/system-configuration-model');
const Identity = require('../models/identity-model');

let allowedValues;

const errors = {
    organizationIdentityNotFound: 'Organization identity not found',
    organizationIdentityNotSet: 'Organization identity not set'
};
exports.errors = errors;

exports.retrieveAllowedValues = function(callback) {
    if (allowedValues) {
        // Return existing object asynchronously
        process.nextTick(() => callback(null, allowedValues));
    }
    else {
        fs.readFile(config.configurationFiles.allowedValues, (err, data) => {
            if (err) {
                return callback(err);
            }
            else {
                try {
                    allowedValues = JSON.parse(data);
                    return callback(null, allowedValues);
                }
                catch (error) {
                    return callback(error);
                }
            }
        });
    }
}

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
