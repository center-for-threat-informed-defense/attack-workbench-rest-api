'use strict';

const tacticsService = require('../services/tactics-service');
const logger = require('../lib/logger');

exports.retrieveAll = function(req, res) {
    tacticsService.retrieveAll(function(err, tactics) {
        if (err) {
            logger.error('Failed with error: ' + err);
            return res.status(500).send('Unable to get tactics. Server error.');
        }
        else {
            logger.debug(`Success: Retrieved ${ tactics.length } tactic(s)`);
            return res.status(200).send(tactics);
        }
    });
};

exports.retrieveById = function(req, res) {
    const versions = req.query.versions || 'latest';

    tacticsService.retrieveById(req.params.stixId, versions, function (err, tactics) {
        if (err) {
            if (err.message === tacticsService.errors.badlyFormattedParameter) {
                logger.warn('Badly formatted stix id: ' + req.params.stixId);
                return res.status(400).send('Stix id is badly formatted.');
            }
            else if (err.message === tacticsService.errors.invalidQueryStringParameter) {
                logger.warn('Invalid query string: versions=' + req.query.versions);
                return res.status(400).send('Query string parameter versions is invalid.');
            }
            else {
                logger.error('Failed with error: ' + err);
                return res.status(500).send('Unable to get tactics. Server error.');
            }
        }
        else {
            if (tactics.length === 0) {
                return res.status(404).send('Tactic not found.');
            }
            else {
                logger.debug(`Success: Retrieved ${ tactics.length } tactic(s) with id ${ req.params.stixId }`);
                return res.status(200).send(tactics);
            }
        }
    });
};

exports.retrieveVersionById = function(req, res) {
    tacticsService.retrieveVersionById(req.params.stixId, req.params.modified, function (err, tactic) {
        if (err) {
            if (err.message === tacticsService.errors.badlyFormattedParameter) {
                logger.warn('Badly formatted stix id: ' + req.params.stixId);
                return res.status(400).send('Stix id is badly formatted.');
            }
            else {
                logger.error('Failed with error: ' + err);
                return res.status(500).send('Unable to get tactic. Server error.');
            }
        } else {
            if (!tactic) {
                return res.status(404).send('tactic not found.');
            }
            else {
                logger.debug(`Success: Retrieved tactic with id ${tactic.id}`);
                return res.status(200).send(tactic);
            }
        }
    });
};

exports.create = function(req, res) {
    // Get the data from the request
    const tacticData = req.body;

    // Create the tactic
    tacticsService.create(tacticData, function(err, tactic) {
        if (err) {
            if (err.message === tacticsService.errors.duplicateId) {
                logger.warn("Duplicate stix.id and stix.modified");
                return res.status(409).send('Unable to create tactic. Duplicate stix.id and stix.modified properties.');
            }
            else {
                logger.error("Failed with error: " + err);
                return res.status(500).send("Unable to create tactic. Server error.");
            }
        }
        else {
            logger.debug("Success: Created tactic with id " + tactic.stix.id);
            return res.status(201).send(tactic);
        }
    });
};

exports.updateFull = function(req, res) {
    // Get the data from the request
    const tacticData = req.body;

    // Create the tactic
    tacticsService.updateFull(req.params.stixId, req.params.modified, tacticData, function(err, tactic) {
        if (err) {
            logger.error("Failed with error: " + err);
            return res.status(500).send("Unable to update tactic. Server error.");
        }
        else {
            if (!tactic) {
                return res.status(404).send('tactic not found.');
            } else {
                logger.debug("Success: Updated tactic with id " + tactic.stix.id);
                return res.status(200).send(tactic);
            }
        }
    });
};

exports.delete = function(req, res) {
    tacticsService.delete(req.params.stixId, req.params.modified, function (err, tactic) {
        if (err) {
            logger.error('Delete tactic failed. ' + err);
            return res.status(500).send('Unable to delete tactic. Server error.');
        }
        else {
            if (!tactic) {
                return res.status(404).send('tactic not found.');
            } else {
                logger.debug("Success: Deleted tactic with id " + tactic.stix.id);
                return res.status(204).end();
            }
        }
    });
};