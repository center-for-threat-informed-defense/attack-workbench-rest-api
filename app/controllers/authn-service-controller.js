'use strict';

const authnServiceService = require('../services/authn-service-service');
const logger = require('../lib/logger');

exports.login = async function(req, res) {
    try {
        await authnServiceService.login();
        logger.debug('Success: Service logged in.');
        return res.status(201).send();
    }
    catch(err) {
        logger.error('Unable to log in service, failed with error: ' + err);
        return res.status(500).send('Unable to log in service. Server error.');
    }
};

exports.logout = async function(req, res) {
    try {
        await authnServiceService.login();
        logger.debug('Success: Service logged out.');
        return res.status(201).send();
    }
    catch(err) {
        logger.error('Unable to log out service, failed with error: ' + err);
        return res.status(500).send('Unable to log out service. Server error.');
    }
};
