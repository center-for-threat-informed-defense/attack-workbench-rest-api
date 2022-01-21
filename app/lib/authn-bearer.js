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

let authenticateWithBearerToken = defaultBearerAuthenticate;

/**
 * This function provides a default handler for authentication when bearer authentication is not enabled
 * If bearer authentication is enabled, this function will be replaced with a passport.authenticate() function.
 */
function defaultBearerAuthenticate(req, res, next) {
    if (req.isAuthenticated()) {
        // User has been authenticated using a non-Bearer method
        next();
    }
    else {
        return res.status(401).send('Not authorized');
    }
}

/**
 * Note that the bearer strategy calls the verify callback on every request, and uses the user session
 * returned by that function. Therefore, serializeUser() and deserializeUser() in this module only need
 * to mock the normal serialization/deserialization process.
 */

/**
 * This function takes the user session object and returns the value (the userSessionKey) that will be
 * stored in the express session for this user
 */
exports.serializeUser = function(userSession, done) {
    if (userSession.strategy === 'bearer') {
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
 * returns the user session object
 */
exports.deserializeUser = function(userSessionKey, done) {
    if (userSessionKey.strategy === 'bearer') {
        done(null, {});
    }
    else {
        // Try the next deserializer
        done('pass');
    }
};

exports.getStrategy = function() {
    // Create the JWKS client
    jwksClient = jwks({
        jwksUri: config.serviceAuthn.oidcClientCredentials.jwksUri
    });

    const strategy = new BearerStrategy(verifyCallback);
    authenticateWithBearerToken = passport.authenticate(strategy.name);

    return strategy;
}

function verifyApikeyToken(token, done) {
    if (!config.serviceAuthn.apikey.enable) {
        return done(null, false, { message: 'Authentication mechanism not found' });
    }

    let payload;
    try {
        // Verify that the token is valid and extract the payload
        payload = jwt.verify(token, config.serviceAuthn.apikey.secret, { algorithms: ['HS256'] });
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
    jwksClient.getSigningKey(decodedHeader.kid)
        .then(function (signingKey) {
            let payload;
            try {
                payload = jwt.verify(token, signingKey.getPublicKey(), { algorithms: ['RS256'] });

                // Make sure the client is allowed to access the REST API
                const clients = config.serviceAuthn.oidcClientCredentials.clients;
                const client = clients.find(c => c.clientId === payload.clientId);
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
        .catch(err => done(err));
}

/**
 * This function is called by the strategy when the user is authenticating using the bearer strategy
 * It verifies that the token is valid, then creates and returns the user session for this user
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
    else {
        return verifyApikeyToken(token, done);
    }
}

function makeUserSession(clientId, serviceName) {
    const userSession = {
        strategy: 'bearer',
        clientId,
        serviceName
    };

    return userSession;
}

exports.authenticate = function(req, res, next) {
    if (req.get('Authorization')) {
        // Authorization header found
        // Authenticate the user using the Bearer token
        authenticateWithBearerToken(req, res, next);
    }
    else if (req.isAuthenticated()) {
        // User has been authenticated using a non-Bearer method
        next();
    }
    else {
        return res.status(401).send('Not authorized');
    }
}

