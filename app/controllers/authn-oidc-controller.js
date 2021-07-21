'use strict';

const authnOidcService = require('../services/authn-oidc-service');
const logger = require('../lib/logger');

exports.login = async function(req, res) {
    try {
        await authnOidcService.login();
        logger.debug('Success: OIDC user logged in.');
        return res.status(201).send();
    }
    catch(err) {
        logger.error('Unable to log in OIDC user, failed with error: ' + err);
        return res.status(500).send('Unable to log in OIDC user. Server error.');
    }
};

exports.identityProviderCallback = async function(req, res) {
    try {
        await authnOidcService.login();
        logger.debug('Success: OIDC user logged in.');
        return res.status(201).send();
    }
    catch(err) {
        logger.error('Unable to log in OIDC user, failed with error: ' + err);
        return res.status(500).send('Unable to log in OIDC user. Server error.');
    }
};

exports.logout = async function(req, res) {
    try {
        await authnOidcService.login();
        logger.debug('Success: OIDC user logged out.');
        return res.status(201).send();
    }
    catch(err) {
        logger.error('Unable to log out OIDC user, failed with error: ' + err);
        return res.status(500).send('Unable to log out OIDC user. Server error.');
    }
};
