'use strict';

const collectionsService = require('../services/collections-service');
const logger = require('../lib/logger');

exports.retrieveAll = function(req, res) {
    const options = {
        offset: req.query.offset || 0,
        limit: req.query.limit || 0,
        state: req.query.state,
        includeRevoked: req.query.includeRevoked,
        includeDeprecated: req.query.includeDeprecated
    }

    collectionsService.retrieveAll(options, function(err, collections) {
        if (err) {
            logger.error('Failed with error: ' + err);
            return res.status(500).send('Unable to get collections. Server error.');
        }
        else {
            logger.debug(`Success: Retrieved ${ collections.length } collection(s)`);
            return res.status(200).send(collections);
        }
    });
};

exports.retrieveById = function(req, res) {
    const versions = req.query.versions || 'latest';

    collectionsService.retrieveById(req.params.stixId, versions, function (err, collections) {
        if (err) {
            if (err.message === collectionsService.errors.badlyFormattedParameter) {
                logger.warn('Badly formatted stix id: ' + req.params.stixId);
                return res.status(400).send('Stix id is badly formatted.');
            }
            else if (err.message === collectionsService.errors.invalidQueryStringParameter) {
                logger.warn('Invalid query string: versions=' + req.query.versions);
                return res.status(400).send('Query string parameter versions is invalid.');
            }
            else {
                logger.error('Failed with error: ' + err);
                return res.status(500).send('Unable to get collections. Server error.');
            }
        }
        else {
            if (collections.length === 0) {
                return res.status(404).send('Collection not found.');
            }
            else {
                logger.debug(`Success: Retrieved ${ collections.length } collection(s) with id ${ req.params.stixId }`);
                return res.status(200).send(collections);
            }
        }
    });
};

