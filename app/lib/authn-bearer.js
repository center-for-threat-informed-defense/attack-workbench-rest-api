'use strict';

const passport = require('passport');
const BearerStrategy = require('passport-http-bearer');
const jwtDecoder = require('jwt-decode');
const jwt = require('jsonwebtoken');
const jwks = require('jwks-rsa');

const config = require('../config/config');

let jwksClient;

let strategyName;
exports.strategyName = function() {
    return strategyName;
}

/**
 * This function takes the user session object and returns the value (the userSessionKey) that will be
 * stored in the express session for this user
 */
exports.serializeUser = function(userSession, done) {
    if (userSession.strategy === 'bearer') {
        // This indicates that the client has been authenticated using the Bearer strategy. This will be used when
        // deserializing.
        const userSessionKey = { strategy: 'bearer' };
        done(null, userSessionKey);
    }
    else {
        // Try the next serializer
        done('pass');
    }
};

/**
 * This function takes the userSessionKey (the value stored in the express session for this user) and
 * returns the user session object.
 *
 * This implementations returns a null value if the strategy is 'bearer'. This causes req.user to be set to null.
 * Since other strategies depend on req.user being set to indicate that the user is authenticated, this prevents
 * those strategies from incorrectly believing the user is authenticated.
 *
 * Note that req.user will be set to the correct value after the strategy calls verifyCallback() and the Bearer token
 * is verified.
 */
exports.deserializeUser = function(userSessionKey, done) {
    if (userSessionKey.strategy === 'bearer') {
        done(null, null);
    }
    else {
        // Try the next deserializer
        done('pass');
    }
};

let authenticateWithBearerToken;
exports.getStrategy = function() {
    // Create the JWKS client
    jwksClient = jwks({
        jwksUri: config.serviceAuthn.oidcClientCredentials.jwksUri
    });

    const strategy = new BearerStrategy(verifyCallback);
    strategyName = strategy.name;

    // Get a passport authenticate middleware function for this strategy
    authenticateWithBearerToken = passport.authenticate(strategy.name);

    return strategy;
}

function verifyApikeyToken(token, done) {
    // Do not attempt to verify the token unless apikey authentication is enabled
    if (!config.serviceAuthn.challengeApikey.enable) {
        return done(null, false, { message: 'Authentication mechanism not found' });
    }

    let payload;
    try {
        // Verify that the token is valid and extract the payload
        payload = jwt.verify(token, config.serviceAuthn.challengeApikey.secret, { algorithms: ['HS256'] });
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return done(null, false, { message: 'Token expired' });
        } else if (err.name === 'JsonWebTokenError' && err.message === 'invalid signature') {
            return done(null, false, { message: 'Invalid signature' });
        } else {
            return done(err);
        }
    }

    const userSession = makeUserSession(null, payload.serviceName);

    return done(null, userSession);
}

function verifyClientCredentialsToken(token, decodedHeader, done) {
    // Do not attempt to verify the token unless client credentials authentication is enabled
    if (!config.serviceAuthn.oidcClientCredentials.enable) {
        return done(null, false, { message: 'Authentication mechanism not found' });
    }

    jwksClient.getSigningKey(decodedHeader.kid)
        .then(function (signingKey) {
            let payload;
            try {
                payload = jwt.verify(token, signingKey.getPublicKey(), { algorithms: ['RS256'] });

                // Make sure the client is allowed to access the REST API
                // Okta returns the client id in payload.cid
                // Keycloak returns the client id in payload.clientId
                const clientId = payload.cid || payload.clientId;
                const clients = config.serviceAuthn.oidcClientCredentials.clients;
                const client = clients.find(c => c.clientId === clientId);
                if (!client) {
                    return done(null, false, { message: 'Client not found' });
                }
            } catch (err) {
                if (err.name === 'TokenExpiredError') {
                    return done(null, false, { message: 'Token expired' });
                } else {
                    return done(err);
                }
            }

            const userSession = makeUserSession(payload.clientId);

            return done(null, userSession);
        })
        .catch(err => {
            if (err.name === 'SigningKeyNotFoundError') {
                return done(null, false, { message: 'Signing key not found'});
            }
            else {
                return done(err);
            }
        });
}

/**
 * This function is called by the strategy when the user is authenticating using the bearer strategy.
 * It verifies that the token is valid, then creates and returns the user session for this user.
 * It makes the assumption that if the alg property of the token header is 'RS256' that the token comes from
 * the OIDC client credentials flow, and if the alg property is 'HS256' that the token was generated from an apikey.
 */
function verifyCallback(token, done) {
    if (!token) {
        return done(null, false, { message: 'Missing token' });
    }

    let decodedHeader;
    try {
        decodedHeader = jwtDecoder(token, { header: true });
    }
    catch(err) {
        return done(null, false, err);
    }

    if (decodedHeader.alg === 'RS256') {
        return verifyClientCredentialsToken(token, decodedHeader, done);
    }
    else if (decodedHeader.alg === 'HS256') {
        return verifyApikeyToken(token, done);
    }
    else {
        return done(null, false, { message: 'Unknown token' });
    }
}

function makeUserSession(clientId, serviceName) {
    const userSession = {
        strategy: 'bearer',
        clientId,
        serviceName,
        service: true
    };

    return userSession;
}

/**
 * The bearer strategy requires the Bearer token to be validated for every request. This middleware function
 * calls the authenticate() function for the Bearer strategy (which cause the token to be validated).
 *
 */
exports.authenticate = function(req, res, next) {
    if (authenticateWithBearerToken) {
        authenticateWithBearerToken(req, res, next);
    }
    else {
        throw new Error('Bearer strategy not configured');
    }
}

