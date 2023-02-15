'use strict';

const softwareService = require('../services/software-service');
const attackObjectsController = require('./attack-objects-controller');
const logger = require('../lib/logger');

exports.retrieveAll = function(req, res) {
    const options = {
        offset: req.query.offset || 0,
        limit: req.query.limit || 0,
        domain: req.query.domain,
        platform: req.query.platform,
        state: req.query.state,
        includeRevoked: req.query.includeRevoked,
        includeDeprecated: req.query.includeDeprecated,
        includeDeleted: req.query.includeDeleted,
        search: req.query.search,
        includePagination: req.query.includePagination
    };

    softwareService.retrieveAll(options, function(err, results) {
        if (err) {
            logger.error('Failed with error: ' + err);
            return res.status(500).send('Unable to get software. Server error.');
        }
        else {
            if (options.includePagination) {
                logger.debug(`Success: Retrieved ${ results.data.length } of ${ results.pagination.total } total software`);
            }
            else {
                logger.debug(`Success: Retrieved ${ results.length } software`);
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

    softwareService.retrieveById(req.params.stixId, options, function (err, software) {
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
    const options = {
        includeDeleted: req.query.includeDeleted
    };

    softwareService.retrieveVersionById(req.params.stixId, req.params.modified, options, function (err, software) {
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

exports.create = async function(req, res) {
    // Get the data from the request
    const softwareData = req.body;

    // Create the software
    try {
        const options = {
            import: false,
            userAccountId: req.user?.userAccountId
        };
        const software = await softwareService.create(softwareData, options);
        logger.debug("Success: Created software with id " + software.stix.id);
        return res.status(201).send(software);
    }
    catch(err) {
        if (err.message === softwareService.errors.duplicateId) {
            logger.warn("Duplicate stix.id and stix.modified");
            return res.status(409).send('Unable to create software. Duplicate stix.id and stix.modified properties.');
        }
        else if (err.message === softwareService.errors.missingProperty) {
            logger.warn(`Unable to create software, missing property ${ err.propertyName }`);
            return res.status(400).send(`Unable to create software, missing property ${ err.propertyName }`);
        }
        else if (err.message === softwareService.errors.propertyNotAllowed) {
            logger.warn(`Unable to create software, property ${ err.propertyName } is not allowed`);
            return res.status(400).send(`Unable to create software, property ${ err.propertyName } is not allowed`);
        }
        else {
            logger.error("Failed with error: " + err);
            return res.status(500).send("Unable to create software. Server error.");
        }
    }
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

exports.deleteById = attackObjectsController.makeDeleteByIdSync(softwareService);
exports.deleteVersionById = attackObjectsController.makeDeleteVersionByIdSync(softwareService);
