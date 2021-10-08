'use strict';

const systemConfigurationService = require('../services/system-configuration-service');
const logger = require('../lib/logger');

exports.retrieveSystemVersion = function(req, res) {
    try {
        const systemVersionInfo = systemConfigurationService.retrieveSystemVersion();
        logger.debug(`Success: Retrieved system version, version: ${ systemVersionInfo.version }, attackSpecVersion: ${ systemVersionInfo.attackSpecVersion }`);
        return res.status(200).send(systemVersionInfo);
    }
    catch(err) {
        logger.error("Unable to retrieve system version, failed with error: " + err);
        return res.status(500).send("Unable to retrieve system version. Server error.");
    }
};

exports.retrieveAllowedValues = function(req, res) {
    systemConfigurationService.retrieveAllowedValues(function(err, allowedValues) {
        if (err) {
            logger.error("Unable to retrieve allowed values, failed with error: " + err);
            return res.status(500).send("Unable to retrieve allowed values. Server error.");
        }
        else {
            logger.debug("Success: Retrieved allowed values.");
            return res.status(200).send(allowedValues);
        }
    });
};

exports.retrieveOrganizationIdentity = async function(req, res) {
    try {
        const identity = await systemConfigurationService.retrieveOrganizationIdentity();
        logger.debug("Success: Retrieved organization identity.");
        return res.status(200).send(identity);
    }
    catch(err) {
        logger.error("Unable to retrieve organization identity, failed with error: " + err);
        return res.status(500).send("Unable to retrieve organization identity. Server error.");
    }
};

exports.setOrganizationIdentity = async function(req, res) {
    const organizationIdentity = req.body;
    if (!organizationIdentity.id) {
        logger.warn('Missing organization identity id');
        return res.status(400).send('Organization identity id is required');
    }

    try {
        await systemConfigurationService.setOrganizationIdentity(organizationIdentity.id);
        logger.debug(`Success: Set organization identity to: ${ organizationIdentity.id }`);
        return res.status(204).send();
    }
    catch(err) {
        logger.error("Unable to set organization identity, failed with error: " + err);
        return res.status(500).send("Unable to seet organization identity. Server error.");
    }
};
