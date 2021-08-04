'use strict';

const openIdClient = require('openid-client');
const config = require('../config/config');
const userAccountsService = require("../services/user-accounts-service");

/**
 * This function takes the user session object and returns the value (the userSessionKey) that will be
 * stored in the express session for this user
 */
exports.serializeUser = function(userSession, done) {
    const userSessionKey = {
        strategy: 'oidc',
        sessionId: userSession.email
    }
    done(null, userSessionKey);
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
        throw new Error('Cannot deserialize userSessionKey, wrong strategy');
    }
};

exports.getStrategy = async function() {
    const issuer = await openIdClient.Issuer.discover(config.authn.oidc.issuerUrl);

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
    const strategy = new openIdClient.Strategy(strategyOptions, (tokenSet, userInfo, done) => done(null, tokenSet.claims()));

    return strategy;
}

async function makeUserSession(email) {
    const userAccount = await userAccountsService.retrieveByEmail(email);

    if (userAccount) {
        const userAccountData = (({ email, name, status, role, registered }) => ({ email, name, status, role, registered }))(userAccount);
        const userSession = {
            userAccountId: userAccount.id,
            ...userAccountData,
            registered: true
        };

        return userSession;
    }
    else {
        const userSession = {
            email: email,
            role: 'none',
            registered: false
        };

        return userSession;
    }
}

