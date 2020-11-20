'use strict';

const techniquesService = require('../services/techniques-service');
const logger = require('../lib/logger');

exports.retrieveAll = function(req, res) {
    techniquesService.retrieveAll(function(err, techniques) {
        if (err) {
            logger.error('Failed with error: ' + err);
            return res.status(500).send('Unable to get techniques. Server error.');
        }
        else {
            logger.debug(`Success: Retrieved ${ techniques.length } technique(s)`);
            return res.status(200).send(techniques);
        }
    });
};

exports.retrieveById = function(req, res) {
    const versions = req.query.versions || 'latest';

    techniquesService.retrieveById(req.params.stixId, versions, function (err, techniques) {
        if (err) {
            if (err.message === techniquesService.errors.badlyFormattedParameter) {
                logger.warn('Badly formatted stix id: ' + req.params.stixId);
                return res.status(400).send('Stix id is badly formatted.');
            }
            else if (err.message === techniquesService.errors.invalidQueryStringParameter) {
                logger.warn('Invalid query string: versions=' + req.query.versions);
                return res.status(400).send('Query string parameter versions is invalid.');
            }
            else {
                logger.error('Failed with error: ' + err);
                return res.status(500).send('Unable to get techniques. Server error.');
            }
        }
        else {
            logger.debug(`Success: Retrieved ${ techniques.length } technique(s) with id ${ req.params.stixId }`);
            return res.status(200).send(techniques);
        }
    });
};

exports.retrieveVersionById = function(req, res) {
    techniquesService.retrieveVersionById(req.params.stixId, req.params.modified, function (err, technique) {
        if (err) {
            if (err.message === techniquesService.errors.badlyFormattedParameter) {
                logger.warn('Badly formatted stix id: ' + req.params.stixId);
                return res.status(400).send('Stix id is badly formatted.');
            }
            else {
                logger.error('Failed with error: ' + err);
                return res.status(500).send('Unable to get technique. Server error.');
            }
        } else {
            if (!technique) {
                return res.status(404).send('Technique not found.');
            }
            else {
                logger.debug(`Success: Retrieved technique with id ${technique.id}`);
                return res.status(200).send(technique);
            }
        }
    });
};

exports.create = function(req, res) {
    // Get the data from the request
    const techniqueData = req.body;

    // Create the technique
    techniquesService.create(techniqueData, function(err, technique) {
        if (err) {
            if (err.message === techniquesService.errors.duplicateId) {
                logger.warn("Duplicate stix.id and stix.modified");
                return res.status(409).send('Unable to create technique. Duplicate stix.id and stix.modified properties.');
            }
            else {
                logger.error("Failed with error: " + err);
                return res.status(500).send("Unable to create technique. Server error.");
            }
        }
        else {
            logger.debug("Success: Created technique with id " + technique.stix.id);
            return res.status(201).send(technique);
        }
    });
};

exports.updateFull = function(req, res) {
    // Get the data from the request
    const techniqueData = req.body;

    // Create the technique
    techniquesService.updateFull(req.params.stixId, req.params.modified, techniqueData, function(err, technique) {
        if (err) {
            logger.error("Failed with error: " + err);
            return res.status(500).send("Unable to update technique. Server error.");
        }
        else {
            if (!technique) {
                return res.status(404).send('Technique not found.');
            } else {
                logger.debug("Success: Updated technique with id " + technique.stix.id);
                return res.status(200).send(technique);
            }
        }
    });
};

exports.delete = function(req, res) {
    techniquesService.delete(req.params.stixId, req.params.modified, function (err, technique) {
        if (err) {
            logger.error('Delete technique failed. ' + err);
            return res.status(500).send('Unable to delete technique. Server error.');
        }
        else {
            if (!technique) {
                return res.status(404).send('Technique not found.');
            } else {
                logger.debug("Success: Deleted technique with id " + technique.stix.id);
                return res.status(204).end();
            }
        }
    });
};
