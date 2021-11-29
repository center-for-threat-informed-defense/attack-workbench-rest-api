'use strict';

const matricesService = require('../services/matrices-service');
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

    matricesService.retrieveAll(options, function(err, results) {
        if (err) {
            logger.error('Failed with error: ' + err);
            return res.status(500).send('Unable to get matrices. Server error.');
        }
        else {
            if (options.includePagination) {
                logger.debug(`Success: Retrieved ${ results.data.length } of ${ results.pagination.total } total matrices`);
            }
            else {
                logger.debug(`Success: Retrieved ${ results.length } matrices`);
            }
            return res.status(200).send(results);
        }
    });
};

exports.retrieveById = function(req, res) {
    const options = {
        versions: req.query.versions || 'latest'
    }

    matricesService.retrieveById(req.params.stixId, options, function (err, matrices) {
        if (err) {
            if (err.message === matricesService.errors.badlyFormattedParameter) {
                logger.warn('Badly formatted stix id: ' + req.params.stixId);
                return res.status(400).send('Stix id is badly formatted.');
            }
            else if (err.message === matricesService.errors.invalidQueryStringParameter) {
                logger.warn('Invalid query string: versions=' + req.query.versions);
                return res.status(400).send('Query string parameter versions is invalid.');
            }
            else {
                logger.error('Failed with error: ' + err);
                return res.status(500).send('Unable to get matrices. Server error.');
            }
        }
        else {
            if (matrices.length === 0) {
                return res.status(404).send('Matrix not found.');
            }
            else {
                logger.debug(`Success: Retrieved ${ matrices.length } matrices with id ${ req.params.stixId }`);
                return res.status(200).send(matrices);
            }
        }
    });
};

exports.retrieveVersionById = function(req, res) {
    matricesService.retrieveVersionById(req.params.stixId, req.params.modified, function (err, matrix) {
        if (err) {
            if (err.message === matricesService.errors.badlyFormattedParameter) {
                logger.warn('Badly formatted stix id: ' + req.params.stixId);
                return res.status(400).send('Stix id is badly formatted.');
            }
            else {
                logger.error('Failed with error: ' + err);
                return res.status(500).send('Unable to get matrix. Server error.');
            }
        } else {
            if (!matrix) {
                return res.status(404).send('Matrix not found.');
            }
            else {
                logger.debug(`Success: Retrieved matrix with id ${matrix.id}`);
                return res.status(200).send(matrix);
            }
        }
    });
};

exports.create = async function(req, res) {
    // Get the data from the request
    const matrixData = req.body;

    // Create the matrix
    try {
        const options = {
            import: false,
            userAccountId: req.user?.userAccountId
        };
        const matrix = await matricesService.create(matrixData, options);
        logger.debug("Success: Created matrix with id " + matrix.stix.id);
        return res.status(201).send(matrix);
    }
    catch(err) {
        if (err.message === matricesService.errors.duplicateId) {
            logger.warn("Duplicate stix.id and stix.modified");
            return res.status(409).send('Unable to create matrix. Duplicate stix.id and stix.modified properties.');
        }
        else {
            logger.error("Failed with error: " + err);
            return res.status(500).send("Unable to create matrix. Server error.");
        }
    }
};

exports.updateFull = function(req, res) {
    // Get the data from the request
    const matrixData = req.body;

    // Create the matrix
    matricesService.updateFull(req.params.stixId, req.params.modified, matrixData, function(err, matrix) {
        if (err) {
            logger.error("Failed with error: " + err);
            return res.status(500).send("Unable to update matrix. Server error.");
        }
        else {
            if (!matrix) {
                return res.status(404).send('Matrix not found.');
            } else {
                logger.debug("Success: Updated matrix with id " + matrix.stix.id);
                return res.status(200).send(matrix);
            }
        }
    });
};

exports.delete = function(req, res) {
    matricesService.delete(req.params.stixId, req.params.modified, function (err, matrix) {
        if (err) {
            logger.error('Delete matrix failed. ' + err);
            return res.status(500).send('Unable to delete matrix. Server error.');
        }
        else {
            if (!matrix) {
                return res.status(404).send('Matrix not found.');
            } else {
                logger.debug("Success: Deleted matrix with id " + matrix.stix.id);
                return res.status(204).end();
            }
        }
    });
};
