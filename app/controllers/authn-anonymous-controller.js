'use strict';

const authnAnonymousService = require('../services/authn-anonymous-service');
const logger = require('../lib/logger');

exports.login = async function(req, res) {
    try {
        await authnAnonymousService.login();
        logger.debug('Success: Anonymous user logged in.');
        return res.status(201).send();
    }
    catch(err) {
        logger.error('Unable to log in anonymous user, failed with error: ' + err);
        return res.status(500).send('Unable to log in anonymous user. Server error.');
    }
};

exports.logout = async function(req, res) {
    try {
        await authnAnonymousService.login();
        logger.debug('Success: Anonymous user logged out.');
        return res.status(201).send();
    }
    catch(err) {
        logger.error('Unable to log out anonymous user, failed with error: ' + err);
        return res.status(500).send('Unable to log out anonymous user. Server error.');
    }
};
