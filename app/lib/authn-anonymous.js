'use strict';

const AnonymousUuidStrategy = require('passport-anonym-uuid');

exports.serializeUser = function(userSession, done) {
    const userKey = {
        strategy: 'anonymId',
        userId: userSession.userId
    }
    done(null, userKey);
};

exports.deserializeUser = function(userKey, done) {
        const userSession = makeUserSession(userKey.userId);
        done(null, userSession);
};

exports.getStrategy = function() {
    return new AnonymousUuidStrategy(verifyCallback);
}

function verifyCallback(req, uuid, done) {
    const userSession = makeUserSession(uuid);
    return done(null, userSession);
}

function makeUserSession(userId) {
    const userSession = {
        email: null,
        name: 'anonymous',
        status: 'active',
        role: 'admin',
        identity: null,
        registered: true,
        userId: userId
    };

    return userSession;
}
