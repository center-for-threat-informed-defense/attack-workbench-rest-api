'use strict';

const express = require('express');
const passport = require('passport');

const config = require('../config/config');
const logger = require('./logger');
const anonymousConfig = require('./authn-anonymous');
const oidcConfig = require('./authn-oidc');
const bearerConfig = require('./authn-bearer');
const basicConfig = require('./authn-basic');

const availableMechanisms = new Map([['oidc', oidcConfig], ['anonymous', anonymousConfig], ['bearer', bearerConfig], ['basic', basicConfig]]);

exports.passportMiddleware = function() {
    const router = express.Router();

    // Configure passport middleware
    router.use(passport.initialize());
    router.use(passport.session());

    return router;
}

exports.configurePassport = async function(mechanismName) {
    // Configure passport with the selected authentication mechanism
    const mechanism = availableMechanisms.get(mechanismName);
    if (mechanism) {
        try {
            passport.serializeUser(mechanism.serializeUser);
            passport.deserializeUser(mechanism.deserializeUser);

            const strategy = await mechanism.getStrategy();
            passport.use(strategy);

            logger.info(`Configured authentication mechanism: ${ mechanismName }`);
        }
        catch(err) {
            logger.error(`Unable to configure system with authentication mechanism ${ mechanismName }`, err);
        }
    }
    else {
        logger.error(`Unable to configure system with unknown authentication mechanism: ${ mechanismName }`);
        throw new Error(`Unable to configure system with unknown authentication mechanism: ${ mechanismName }`);
    }
}

// Middleware that will return a 404 if the routeMechanism doesn't match the configured authentication mechanism
// This can be used to prevent access to routes that don't match the current configuration
exports.isUserAuthenticationMechanismEnabled = function(routeMechanism) {
    return function(req, res, next) {
        if (config.userAuthn.mechanism === routeMechanism) {
            return next();
        }
        else {
            return res.status(404).send('Authentication mechanism not found');
        }
    }
}

// Middleware that will return a 404 if the routeMechanism doesn't match the configured authentication mechanism
// This can be used to prevent access to routes that don't match the current configuration
exports.isServiceAuthenticationMechanismEnabled = function(routeMechanism) {
    return function(req, res, next) {
        if (routeMechanism === 'challenge-apikey' && config.serviceAuthn.challengeApikey.enable) {
            return next();
        }
        else if (routeMechanism === 'basic-apikey' && config.serviceAuthn.basicApikey.enable) {
            return next();
        }
        else if (routeMechanism === 'client-credentials' && config.serviceAuthn.oidcClientCredentials.enable) {
            return next();
        }
        else {
            return res.status(404).send('Authentication mechanism not found');
        }
    }
}
