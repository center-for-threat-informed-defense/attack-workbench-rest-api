'use strict';

const softwareService = require('../services/software-service');
const logger = require('../lib/logger');

exports.retrieveAll = function(req, res) {
    softwareService.retrieveAll(function(err, software) {
        if (err) {
            logger.error('Failed with error: ' + err);
            return res.status(500).send('Unable to get software. Server error.');
        }
        else {
            logger.debug(`Success: Retrieved ${ software.length } software`);
            return res.status(200).send(software);
        }
    });
};

exports.retrieveById = function(req, res) {
    const versions = req.query.versions || 'latest';

    softwareService.retrieveById(req.params.stixId, versions, function (err, software) {
        if (err) {
            if (err.message === softwareService.errors.badlyFormattedParameter) {
                logger.warn('Badly formatted stix id: ' + req.params.stixId);
                return res.status(400).send('Stix id is badly formatted.');
            }
            else if (err.message === softwareService.errors.invalidQueryStringParameter) {
                logger.warn('Invalid query string: versions=' + req.query.versions);
                return res.status(400).send('Query string parameter versions is invalid.');
            }
            else {
                logger.error('Failed with error: ' + err);
                return res.status(500).send('Unable to get software. Server error.');
            }
        }
        else {
            if (software.length === 0) {
                return res.status(404).send('Software not found.');
            }
            else {
                logger.debug(`Success: Retrieved ${ software.length } software with id ${ req.params.stixId }`);
                return res.status(200).send(software);
            }
        }
    });
};

exports.retrieveVersionById = function(req, res) {
    softwareService.retrieveVersionById(req.params.stixId, req.params.modified, function (err, software) {
        if (err) {
            if (err.message === softwareService.errors.badlyFormattedParameter) {
                logger.warn('Badly formatted stix id: ' + req.params.stixId);
                return res.status(400).send('Stix id is badly formatted.');
            }
            else {
                logger.error('Failed with error: ' + err);
                return res.status(500).send('Unable to get software. Server error.');
            }
        } else {
            if (!software) {
                return res.status(404).send('Software not found.');
            }
            else {
                logger.debug(`Success: Retrieved software with id ${software.id}`);
                return res.status(200).send(software);
            }
        }
    });
};

exports.create = function(req, res) {
    // Get the data from the request
    const softwareData = req.body;

    // Create the software
    softwareService.create(softwareData, function(err, software) {
        if (err) {
            if (err.message === softwareService.errors.duplicateId) {
                logger.warn("Duplicate stix.id and stix.modified");
                return res.status(409).send('Unable to create software. Duplicate stix.id and stix.modified properties.');
            }
            else {
                logger.error("Failed with error: " + err);
                return res.status(500).send("Unable to create software. Server error.");
            }
        }
        else {
            logger.debug("Success: Created software with id " + software.stix.id);
            return res.status(201).send(software);
        }
    });
};

exports.updateFull = function(req, res) {
    // Get the data from the request
    const softwareData = req.body;

    // Create the software
    softwareService.updateFull(req.params.stixId, req.params.modified, softwareData, function(err, software) {
        if (err) {
            logger.error("Failed with error: " + err);
            return res.status(500).send("Unable to update software. Server error.");
        }
        else {
            if (!software) {
                return res.status(404).send('Software not found.');
            } else {
                logger.debug("Success: Updated software with id " + software.stix.id);
                return res.status(200).send(software);
            }
        }
    });
};

exports.delete = function(req, res) {
    softwareService.delete(req.params.stixId, req.params.modified, function (err, software) {
        if (err) {
            logger.error('Delete software failed. ' + err);
            return res.status(500).send('Unable to delete software. Server error.');
        }
        else {
            if (!software) {
                return res.status(404).send('Software not found.');
            } else {
                logger.debug("Success: Deleted software with id " + software.stix.id);
                return res.status(204).end();
            }
        }
    });
};
