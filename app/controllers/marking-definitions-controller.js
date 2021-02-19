'use strict';

const markingDefinitionsService = require('../services/marking-definitions-service');
const logger = require('../lib/logger');

// NOTE: A marking definition does not support the modified or revoked properties!!

exports.retrieveAll = function(req, res) {
    const options = {
        offset: req.query.offset || 0,
        limit: req.query.limit || 0,
        state: req.query.state,
        includeDeprecated: req.query.includeDeprecated,
        includePagination: req.query.includePagination
    }

    markingDefinitionsService.retrieveAll(options, function(err, markingDefinitions) {
        if (err) {
            logger.error('Failed with error: ' + err);
            return res.status(500).send('Unable to get marking definitions. Server error.');
        }
        else {
            if (options.includePagination) {
                logger.debug(`Success: Retrieved ${ markingDefinitions.data.length } of ${ markingDefinitions.pagination.total } total marking definition(s)`);
            }
            else {
                logger.debug(`Success: Retrieved ${ markingDefinitions.length } marking definition(s)`);
            }
            return res.status(200).send(markingDefinitions);
        }
    });
};

exports.retrieveById = function(req, res) {
    const options = { };

    markingDefinitionsService.retrieveById(req.params.stixId, options, function (err, markingDefinitions) {
        if (err) {
            if (err.message === markingDefinitionsService.errors.badlyFormattedParameter) {
                logger.warn('Badly formatted stix id: ' + req.params.stixId);
                return res.status(400).send('Stix id is badly formatted.');
            }
            else if (err.message === markingDefinitionsService.errors.invalidQueryStringParameter) {
                logger.warn('Invalid query string: versions=' + req.query.versions);
                return res.status(400).send('Query string parameter versions is invalid.');
            }
            else {
                logger.error('Failed with error: ' + err);
                return res.status(500).send('Unable to get marking definitions. Server error.');
            }
        }
        else {
            if (markingDefinitions.length === 0) {
                return res.status(404).send('Marking definitions not found.');
            }
            else {
                logger.debug(`Success: Retrieved ${ markingDefinitions.length } marking definition with id ${ req.params.stixId }`);
                return res.status(200).send(markingDefinitions);
            }
        }
    });
};

exports.create = function(req, res) {
    // Get the data from the request
    const markingDefinitionData = req.body;

    // Create the marking definition
    markingDefinitionsService.create(markingDefinitionData, function(err, markingDefinition) {
        if (err) {
            if (err.message === markingDefinitionsService.errors.badlyFormattedParameter) {
                logger.warn('Unable to create marking definition: Stix id not allowed');
                return res.status(400).send('Stix id not allowed.');
            }
            else {
                logger.error("Failed with error: " + err);
                return res.status(500).send("Unable to create marking definition. Server error.");
            }
        }
        else {
            logger.debug("Success: Created marking definition with id " + markingDefinition.stix.id);
            return res.status(201).send(markingDefinition);
        }
    });
};

exports.updateFull = function(req, res) {
    // Get the data from the request
    const markingDefinitionData = req.body;

    // Create the marking definition
    markingDefinitionsService.updateFull(req.params.stixId, markingDefinitionData, function(err, markingDefinition) {
        if (err) {
            logger.error("Failed with error: " + err);
            return res.status(500).send("Unable to update marking definition. Server error.");
        }
        else {
            if (!markingDefinition) {
                return res.status(404).send('Marking definition not found.');
            } else {
                logger.debug("Success: Updated marking definition with id " + markingDefinition.stix.id);
                return res.status(200).send(markingDefinition);
            }
        }
    });
};

exports.delete = function(req, res) {
    markingDefinitionsService.delete(req.params.stixId, function (err, markingDefinition) {
        if (err) {
            logger.error('Delete marking definition failed. ' + err);
            return res.status(500).send('Unable to delete marking definition. Server error.');
        }
        else {
            if (!markingDefinition) {
                return res.status(404).send('Marking definition not found.');
            } else {
                logger.debug("Success: Deleted marking definition with id " + markingDefinition.stix.id);
                return res.status(204).end();
            }
        }
    });
};
