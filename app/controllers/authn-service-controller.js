'use strict';

const authnServiceService = require('../services/authn-service-service');
const logger = require('../lib/logger');

exports.apikeyGetChallenge = function(req, res) {
    try {
        const serviceName = req.query.serviceName;
        if (!serviceName) {
            logger.warn('Unable to send service account challenge, missing service name');
            return res.status(400).send('Service name is required');
        }

        const challenge = authnServiceService.createChallenge(serviceName);
        logger.debug('Success: Service account challenge created.');
        return res.status(200).send({ challenge });
    }
    catch(err) {
        if (err.message === authnServiceService.errors.serviceNotFound) {
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

        const token = authnServiceService.createToken(serviceName, challengeHash);
        logger.debug('Success: Service account token created.');
        const message = {
            access_token: token.token,
            expires_in: token.expiresIn
        }
        return res.status(200).send(message);
    }
    catch(err) {
        if (err.message === authnServiceService.errors.invalidChallengeHash) {
            logger.warn('Unable to create service account token, invalid challenge hash');
            return res.status(400).send('Invalid challenge hash');
        }
        else if (err.message === authnServiceService.errors.challengeNotFound) {
            logger.warn('Unable to create service account token, challenge not found');
            return res.status(400).send('Challenge not found');
        }
        else {
            logger.error('Unable to create service account token, failed with error: ' + err);
            return res.status(500).send('Unable to create service account token. Server error.');
        }
    }
};
