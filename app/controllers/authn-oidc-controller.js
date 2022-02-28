'use strict';

const logger = require('../lib/logger');

exports.login = function(req, res, next) {
    // Save the destination and call next() to trigger the redirect to the identity provider
    req.session.oidcDestination = req.query.destination;
    return next();
};

exports.identityProviderCallback = function(req, res) {
    logger.debug('Success: OIDC user logged in.');
    return res.redirect(req.session.oidcDestination);
};

exports.logout = function(req, res) {
    try {
        const email = req.user.email;
        req.logout();
        logger.info(`Success: User logged out with email: ${ email }`);
        return res.status(200).send('User logged out');
    }
    catch(err) {
        logger.error('Unable to log out user, failed with error: ' + err);
        return res.status(500).send('Unable to log out user. Server error.');
    }
};
