'use strict';

const systemConfigurationService = require('../services/system-configuration-service');
const logger = require('../lib/logger');

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

