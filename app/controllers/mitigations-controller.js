'use strict';

const mitigationsService = require('../services/mitigations-service');
const logger = require('../lib/logger');

exports.retrieveAll = function(req, res) {
    const options = {
        offset: req.query.offset || 0,
        limit: req.query.limit || 0,
        state: req.query.state,
        includeRevoked: req.query.includeRevoked,
        includeDeprecated: req.query.includeDeprecated,
        search: req.query.search,
        includePagination: req.query.includePagination
    }

    mitigationsService.retrieveAll(options, function(err, results) {
        if (err) {
            logger.error('Failed with error: ' + err);
            return res.status(500).send('Unable to get mitigations. Server error.');
        }
        else {
            if (options.includePagination) {
                logger.debug(`Success: Retrieved ${ results.data.length } of ${ results.pagination.total } total mitigation(s)`);
            }
            else {
                logger.debug(`Success: Retrieved ${ results.length } mitigation(s)`);
            }
            return res.status(200).send(results);
        }
    });
};

exports.retrieveById = function(req, res) {
    const options = {
        versions: req.query.versions || 'latest'
    }

    mitigationsService.retrieveById(req.params.stixId, options, function (err, mitigations) {
        if (err) {
            if (err.message === mitigationsService.errors.badlyFormattedParameter) {
                logger.warn('Badly formatted stix id: ' + req.params.stixId);
                return res.status(400).send('Stix id is badly formatted.');
            }
            else if (err.message === mitigationsService.errors.invalidQueryStringParameter) {
                logger.warn('Invalid query string: versions=' + req.query.versions);
                return res.status(400).send('Query string parameter versions is invalid.');
            }
            else {
                logger.error('Failed with error: ' + err);
                return res.status(500).send('Unable to get mitigations. Server error.');
            }
        }
        else {
            if (mitigations.length === 0) {
                return res.status(404).send('Mitigation not found.');
            }
            else {
                logger.debug(`Success: Retrieved ${ mitigations.length } mitigation(s) with id ${ req.params.stixId }`);
                return res.status(200).send(mitigations);
            }
        }
    });
};

exports.retrieveVersionById = function(req, res) {
    mitigationsService.retrieveVersionById(req.params.stixId, req.params.modified, function (err, mitigation) {
        if (err) {
            if (err.message === mitigationsService.errors.badlyFormattedParameter) {
                logger.warn('Badly formatted stix id: ' + req.params.stixId);
                return res.status(400).send('Stix id is badly formatted.');
            }
            else {
                logger.error('Failed with error: ' + err);
                return res.status(500).send('Unable to get mitigation. Server error.');
            }
        } else {
            if (!mitigation) {
                return res.status(404).send('Mitigation not found.');
            }
            else {
                logger.debug(`Success: Retrieved mitigation with id ${mitigation.id}`);
                return res.status(200).send(mitigation);
            }
        }
    });
};

exports.create = async function(req, res) {
    // Get the data from the request
    const mitigationData = req.body;

    // Create the mitigation
    try {
        const mitigation = await mitigationsService.create(mitigationData, { import: false });
        logger.debug("Success: Created mitigation with id " + mitigation.stix.id);
        return res.status(201).send(mitigation);
    }
    catch(err) {
        if (err.message === mitigationsService.errors.duplicateId) {
            logger.warn("Duplicate stix.id and stix.modified");
            return res.status(409).send('Unable to create mitigation. Duplicate stix.id and stix.modified properties.');
        }
        else {
            logger.error("Failed with error: " + err);
            return res.status(500).send("Unable to create mitigation. Server error.");
        }
    }
};

exports.updateFull = function(req, res) {
    // Get the data from the request
    const mitigationData = req.body;

    // Create the mitigation
    mitigationsService.updateFull(req.params.stixId, req.params.modified, mitigationData, function(err, mitigation) {
        if (err) {
            logger.error("Failed with error: " + err);
            return res.status(500).send("Unable to update mitigation. Server error.");
        }
        else {
            if (!mitigation) {
                return res.status(404).send('Mitigation not found.');
            } else {
                logger.debug("Success: Updated mitigation with id " + mitigation.stix.id);
                return res.status(200).send(mitigation);
            }
        }
    });
};

exports.delete = function(req, res) {
    mitigationsService.delete(req.params.stixId, req.params.modified, function (err, mitigation) {
        if (err) {
            logger.error('Delete mitigation failed. ' + err);
            return res.status(500).send('Unable to delete mitigation. Server error.');
        }
        else {
            if (!mitigation) {
                return res.status(404).send('Mitigation not found.');
            } else {
                logger.debug("Success: Deleted mitigation with id " + mitigation.stix.id);
                return res.status(204).end();
            }
        }
    });
};
