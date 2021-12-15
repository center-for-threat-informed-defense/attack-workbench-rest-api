'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const NodeCache = require('node-cache');

const config = require('../config/config');

const cache = new NodeCache();

function generateNonce() {
    const stringBase = 'base64';
    const byteLength = 48;
    const buffer = crypto.randomBytes(byteLength);
    const nonce = buffer.toString(stringBase);

    return nonce;
}

const errors = {
    serviceNotFound: 'Service not found',
    invalidChallengeHash: 'Invalid challenge hash',
    challengeNotFound: 'Challenge not found'
};
exports.errors = errors;

exports.createChallenge = function(serviceName) {
    // Verify that the service is on the list of configured services and get the apikey
    const services = config.serviceAuthn.apikey.serviceAccounts;
    const service = services.find(s => s.name === serviceName);
    if (!service) {
        throw new Error(errors.serviceNotFound);
    }

    const challenge = generateNonce();
    const apikey = service.apikey;

    cache.set(serviceName, { challenge, apikey }, 60);

    return { challenge };
}

exports.createToken = function(serviceName, challengeHash) {
    const cachedValue = cache.take(serviceName);

    if (!cachedValue) {
        throw new Error(errors.challengeNotFound);
    }
    const { challenge, apikey } = cachedValue;

    const hmac = crypto.createHmac('sha256', apikey);
    hmac.update(challenge);
    const digest = hmac.digest('hex');

    if (digest !== challengeHash) {
        throw new Error(errors.invalidChallengeHash);
    }

    const payload = {
        serviceName,
        exp: Math.floor(Date.now() / 1000) + config.serviceAuthn.apikey.tokenTimeout
    };
    const token = jwt.sign(payload, config.serviceAuthn.apikey.secret);

    return { token };
}
