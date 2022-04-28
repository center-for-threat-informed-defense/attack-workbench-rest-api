'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const NodeCache = require('node-cache');

const logger = require('../lib/logger');
const config = require('../config/config');

/**
 * Each challenge/apikey pair for a service is cached when the challenge is created. The cached value is used to
 * verify the hashed value provided by the client when requesting a token.
 */
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

function createChallenge(serviceName) {
    // Verify that the service is on the list of configured services and get the apikey
    const services = config.serviceAuthn.challengeApikey.serviceAccounts;
    const service = services.find(s => s.name === serviceName);
    if (!service) {
        throw new Error(errors.serviceNotFound);
    }

    // Generate the challenge string
    const challenge = generateNonce();

    // Save the challenge string and apikey in the cache
    cache.set(serviceName, { challenge, apikey: service.apikey }, 60);

    // Return the challenge
    return challenge;
}

function createToken(serviceName, challengeHash) {
    // Get the cached challenge and apikey
    const cachedValue = cache.take(serviceName);
    if (!cachedValue) {
        throw new Error(errors.challengeNotFound);
    }
    const { challenge, apikey } = cachedValue;

    // Generate the hash
    const hmac = crypto.createHmac('sha256', apikey);
    hmac.update(challenge);
    const digest = hmac.digest('hex');

    // Does the generated hash match the hash provided in the request?
    if (digest !== challengeHash) {
        throw new Error(errors.invalidChallengeHash);
    }

    // Create the payload
    const timeout = config.serviceAuthn.challengeApikey.tokenTimeout;
    const payload = {
        serviceName,
        exp: Math.floor(Date.now() / 1000) + timeout
    };

    // Generate the access token and return it
    const token = jwt.sign(payload, config.serviceAuthn.challengeApikey.secret);
    return { token, expiresIn: timeout };
}

exports.apikeyGetChallenge = function(req, res) {
    try {
        const serviceName = req.query.serviceName;
        if (!serviceName) {
            logger.warn('Unable to send service account challenge, missing service name');
            return res.status(400).send('Service name is required');
        }

        const challenge = createChallenge(serviceName);
        logger.debug('Success: Service account challenge created.');
        return res.status(200).send({ challenge });
    }
    catch(err) {
        if (err.message === errors.serviceNotFound) {
            logger.warn('Unable to create service account challenge, service not found');
            return res.status(404).send('Service not found');
        }
        else {
            logger.error('Unable to create service account challenge, failed with error: ' + err);
            return res.status(500).send('Unable to create service account challenge. Server error.');
        }
    }
};

exports.apikeyGetToken = function(req, res) {
    try {
        const serviceName = req.query.serviceName;
        if (!serviceName) {
            logger.warn('Unable to send service account token, missing service name');
            return res.status(400).send('Service name is required');
        }

        const authorizationHeader = req.get('Authorization');
        if (!authorizationHeader) {
            logger.warn('Unable to send service account token, missing Authorization header');
            return res.status(400).send('Authorization header is required');
        }

        const headerChunks = authorizationHeader.split(' ');
        if (headerChunks.length !== 2) {
            return res.status(400).send('Badly formatted request');
        }

        if (headerChunks[0].toLowerCase() !== 'apikey') {
            return res.status(400).send('Badly formatted request');
        }

        const challengeHash = headerChunks[1];

        const token = createToken(serviceName, challengeHash);
        logger.debug('Success: Service account token created.');
        const message = {
            access_token: token.token,
            expires_in: token.expiresIn
        }
        return res.status(200).send(message);
    }
    catch(err) {
        if (err.message === errors.invalidChallengeHash) {
            logger.warn('Unable to create service account token, invalid challenge hash');
            return res.status(400).send('Invalid challenge hash');
        }
        else if (err.message === errors.challengeNotFound) {
            logger.warn('Unable to create service account token, challenge not found');
            return res.status(400).send('Challenge not found');
        }
        else {
            logger.error('Unable to create service account token, failed with error: ' + err);
            return res.status(500).send('Unable to create service account token. Server error.');
        }
    }
};
