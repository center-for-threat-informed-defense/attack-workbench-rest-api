'use strict';

const openIdClient = require('openid-client');
const retry = require('async-await-retry');

const config = require('../config/config');
const userAccountsService = require("../services/user-accounts-service");

/**
 * This function takes the user session object and returns the value (the userSessionKey) that will be
 * stored in the express session for this user
 */
exports.serializeUser = function(userSession, done) {
    if (userSession.strategy === 'oidc') {
        const userSessionKey = {
            strategy: 'oidc',
            sessionId: userSession.email
        }
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
    if (userSessionKey.strategy === 'oidc') {
        makeUserSession(userSessionKey.sessionId)
            .then(userSession => done(null, userSession))
            .catch(err => done(err));
    }
    else {
        // Try the next deserializer
        done('pass');
    }
};

exports.getStrategy = async function() {
    // Retry to give the identity provider time to start (when using docker-compose)
    const retryOptions = { interval: 1000 };
    const issuer = await retry(openIdClient.Issuer.discover, [config.authn.oidc.issuerUrl], retryOptions);

    const clientOptions = {
        client_id: config.authn.oidc.clientId,
        client_secret: config.authn.oidc.clientSecret,
        redirect_uris: ['http://localhost:3000/api/authn/oidc/callback'],
        response_types: ['code']
    };
    const client = new issuer.Client(clientOptions);

    // oidc strategy for passport
    const strategyOptions = {
        client,
        params: { scope: 'openid email profile' }
    };
    const strategy = new openIdClient.Strategy(strategyOptions, verifyCallback);

    return strategy;
}

/**
 * This function is called by the strategy after the user has authenticated using the oidc strategy
 * It creates and returns the user session for this user
 */
function verifyCallback(tokenSet, userInfo, done) {
    const claims = tokenSet.claims();

    makeUserSession(claims.email)
        .then(userSession => done(null, userSession))
        .catch(err => done(err));
}

async function makeUserSession(email) {
    const userAccount = await userAccountsService.retrieveByEmail(email);

    if (userAccount) {
        const userAccountData = (({ email, name, status, role, registered }) => ({ email, name, status, role, registered }))(userAccount);
        const userSession = {
            strategy: 'oidc',
            userAccountId: userAccount.id,
            ...userAccountData,
            registered: true
        };

        return userSession;
    }
    else {
        const userSession = {
            strategy: 'oidc',
            email: email,
            role: 'none',
            registered: false
        };

        return userSession;
    }
}
