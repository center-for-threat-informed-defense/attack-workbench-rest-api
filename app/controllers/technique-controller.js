'use strict';

const techniqueService = require('../services/technique-service');
const logger = require('../lib/logger');

exports.retrieveAll = function(req, res) {
    techniqueService.retrieveAll(function(err, techniques) {
        if (err) {
            logger.error('Failed with error: ' + err);
            return res.status(500).send('Unable to get techniques. Server error.');
        }
        else {
            return res.status(200).send(techniques);
        }
    });
};

exports.retrieveById = function(req, res) {
    techniqueService.retrieveById(req.params.stixId, function(err, technique) {
        if (err) {
            if (err.message === techniqueService.errors.badlyFormattedParameter) {
                logger.warn('Badly formatted stix id: ' + req.params.stixId);
                return res.status(400).send('Stix id is badly formatted.');
            }
            else {
                logger.error('Failed with error: ' + err);
                return res.status(500).send('Unable to get technique. Server error.');
            }
        }
        else {
            if (!technique) {
                logger.warn('technique not found');
                return res.status(404).send('technique not found.');
            }
            else {
                return res.status(200).send(technique);
            }
        }
    });
};

exports.create = function(req, res) {
    // Get the data from the request
    const techniqueData = req.body;

    // Create the technique
    techniqueService.create(techniqueData, function(err, technique) {
        if (err) {
            if (err.message === techniqueService.errors.duplicateId) {
                logger.warn("Duplicate stix id");
                return res.status(409).send('Duplicate stix id');
            }
            else {
                logger.error("Failed with error: " + err);
                return res.status(500).send("Unable to create technique. Server error.");
            }
        }
        else {
            logger.info("Success: Created technique with id " + technique.id);
            return res.status(201).send(technique);
        }
    });
};
