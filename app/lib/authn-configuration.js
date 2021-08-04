'use strict';

const passport = require('passport');
const express = require('express');
const config = require('../config/config');
const logger = require('./logger');
const anonymousConfig = require('./authn-anonymous');
const oidcConfig = require('./authn-oidc');

const availableMechanisms = new Map([['oidc', oidcConfig], ['anonymous', anonymousConfig]]);

exports.passportMiddleware = function() {
    const router = express.Router();

    // Configure passport middleware
    router.use(passport.initialize());
    router.use(passport.session());

    return router;
}

exports.configurePassport = async function() {
    // Configure passport with the selected authentication mechanism
    const mechanism = availableMechanisms.get(config.authn.mechanism.toLowerCase());
    if (mechanism) {
        try {
            passport.serializeUser(mechanism.serializeUser);
            passport.deserializeUser(mechanism.deserializeUser);

            const strategy = await mechanism.getStrategy();
            passport.use(strategy);
            // eslint-disable-next-line require-atomic-updates
            config.authn.strategyName = strategy.name;

            logger.info(`Configured authentication mechanism: ${config.authn.mechanism}`);
        }
        catch(err) {
            logger.error(`Unable to configure system with authentication mechanism ${ config.authn.mechanism }`, err);
        }
    }
    else {
        logger.error(`Unable to configure system with unknown authentication mechanism: ${ config.authn.mechanism }`);
        throw new Error(`Unable to configure system with unknown authentication mechanism: ${ config.authn.mechanism }`);
    }
}
