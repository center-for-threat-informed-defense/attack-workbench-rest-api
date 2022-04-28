'use strict';

const config = require('../config/config');
const authnBearer = require('../lib/authn-bearer');
const authnBasic = require('../lib/authn-basic');

/**
 * This middleware function verifies that a request is authenticated.
 *
 * The bearer strategy requires the Bearer token to be validated for every request. This middleware function
 * checks for the Authorization header, and if present, calls the authenticate() function for the Bearer
 * strategy (which cause the token to be validated).
 *
 * Other strategies authenticate the user through dedicated endpoints and set a session cookie in the browser.
 * Those strategies rely on the existence of the session cookie and the corresponding server session object
 * when authenticating subsequent requests.
 */
exports.authenticate = function(req, res, next) {
    if ((config.serviceAuthn.oidcClientCredentials.enable  || config.serviceAuthn.challengeApikey.enable) && req.get('Authorization')) {
        // Authorization header found
        // Authenticate the user using the Bearer token
        authnBearer.authenticate(req, res, next);
    }
    else if (config.serviceAuthn.basicApikey.enable && req.get('Authorization')) {
        // Authorization header found
        // Authenticate the user using  Basic with apikey
        authnBasic.authenticate(req, res, next);
    }
    else if (req.isAuthenticated()) {
        // User has been authenticated using a non-Bearer strategy
        next();
    }
    else {
        return res.status(401).send('Not authorized');
    }
}
