'use strict';

const openIdClient = require('openid-client');
const config = require('../config/config');

exports.serializeUser = function(userSession, done) {
    const userKey = {
        strategy: 'oidc',
        userId: userSession.email
    }
    done(null, userKey);
};

exports.deserializeUser = function(userKey, done) {
    const userSession = makeUserSession(userKey.userId);
    done(null, userSession);
};

exports.getStrategy = async function() {
    const issuer = await openIdClient.Issuer.discover(config.oidc.issuerUrl);

    const clientOptions = {
        client_id: config.oidc.clientId,
        client_secret: config.oidc.clientSecret,
        redirect_uris: ['http://localhost:3001/api/oidc/callback'],
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

function makeUserSession(userId) {
    // Stub: replace with lookup of user from database or cache
    const userSession = {
        email: userId,
        name: 'oidc user',
        status: 'active',
        role: 'admin',
        identity: null,
        registered: true,
        userId: userId
    };

    return userSession;
}
