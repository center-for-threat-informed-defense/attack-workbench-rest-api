'use strict';

const identitiesService = require('../services/identities-service');
const attackObjectsController = require('./attack-objects-controller');
const logger = require('../lib/logger');

exports.retrieveAll = function(req, res) {
    const options = {
        offset: req.query.offset || 0,
        limit: req.query.limit || 0,
        state: req.query.state,
        includeRevoked: req.query.includeRevoked,
        includeDeprecated: req.query.includeDeprecated,
        includeDeleted: req.query.includeDeleted,
        includePagination: req.query.includePagination
    };

    identitiesService.retrieveAll(options, function(err, results) {
        if (err) {
            logger.error('Failed with error: ' + err);
            return res.status(500).send('Unable to get identities. Server error.');
        }
        else {
            if (options.includePagination) {
                logger.debug(`Success: Retrieved ${ results.data.length } of ${ results.pagination.total } total identities`);
            }
            else {
                logger.debug(`Success: Retrieved ${ results.length } identities`);
            }
            return res.status(200).send(results);
        }
    });
};

exports.retrieveById = function(req, res) {
    const options = {
        versions: req.query.versions || 'latest',
        includeDeleted: req.query.includeDeleted
    };

    identitiesService.retrieveById(req.params.stixId, options, function (err, identities) {
        if (err) {
            if (err.message === identitiesService.errors.badlyFormattedParameter) {
                logger.warn('Badly formatted stix id: ' + req.params.stixId);
                return res.status(400).send('Stix id is badly formatted.');
            }
            else if (err.message === identitiesService.errors.invalidQueryStringParameter) {
                logger.warn('Invalid query string: versions=' + req.query.versions);
                return res.status(400).send('Query string parameter versions is invalid.');
            }
            else {
                logger.error('Failed with error: ' + err);
                return res.status(500).send('Unable to get identities. Server error.');
            }
        }
        else {
            if (identities.length === 0) {
                return res.status(404).send('Identity not found.');
            }
            else {
                logger.debug(`Success: Retrieved ${ identities.length } identities with id ${ req.params.stixId }`);
                return res.status(200).send(identities);
            }
        }
    });
};

exports.retrieveVersionById = function(req, res) {
    const options = {
        includeDeleted: req.query.includeDeleted
    };

    identitiesService.retrieveVersionById(req.params.stixId, req.params.modified, options, function (err, identity) {
        if (err) {
            if (err.message === identitiesService.errors.badlyFormattedParameter) {
                logger.warn('Badly formatted stix id: ' + req.params.stixId);
                return res.status(400).send('Stix id is badly formatted.');
            }
            else {
                logger.error('Failed with error: ' + err);
                return res.status(500).send('Unable to get identity. Server error.');
            }
        } else {
            if (!identity) {
                return res.status(404).send('Identity not found.');
            }
            else {
                logger.debug(`Success: Retrieved identity with id ${identity.id}`);
                return res.status(200).send(identity);
            }
        }
    });
};

exports.create = async function(req, res) {
    // Get the data from the request
    const identityData = req.body;

    // Create the identity
    try {
        const options = {
            import: false,
            userAccountId: req.user?.userAccountId
        };
        const identity = await identitiesService.create(identityData, options);
        logger.debug("Success: Created identity with id " + identity.stix.id);
        return res.status(201).send(identity);
    }
    catch(err) {
        if (err.message === identitiesService.errors.duplicateId) {
            logger.warn("Duplicate stix.id and stix.modified");
            return res.status(409).send('Unable to create identity. Duplicate stix.id and stix.modified properties.');
        }
        else {
            logger.error("Failed with error: " + err);
            return res.status(500).send("Unable to create identity. Server error.");
        }
    }
};

exports.updateFull = function(req, res) {
    // Get the data from the request
    const identityData = req.body;

    // Create the identity
    identitiesService.updateFull(req.params.stixId, req.params.modified, identityData, function(err, identity) {
        if (err) {
            logger.error("Failed with error: " + err);
            return res.status(500).send("Unable to update identity. Server error.");
        }
        else {
            if (!identity) {
                return res.status(404).send('Identity not found.');
            } else {
                logger.debug("Success: Updated identity with id " + identity.stix.id);
                return res.status(200).send(identity);
            }
        }
    });
};

exports.deleteById = attackObjectsController.makeDeleteByIdSync(identitiesService);
exports.deleteVersionById = attackObjectsController.makeDeleteVersionByIdSync(identitiesService);
