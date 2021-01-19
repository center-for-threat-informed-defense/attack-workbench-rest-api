'use strict';

const relationshipsService = require('../services/relationships-service');
const logger = require('../lib/logger');

exports.retrieveAll = function(req, res) {
    const options = {
        offset: req.query.offset || 0,
        limit: req.query.limit || 0,
        state: req.query.state,
        includeRevoked: req.query.includeRevoked,
        includeDeprecated: req.query.includeDeprecated,
        includePagination: req.query.includePagination
    }

    relationshipsService.retrieveAll(options, function(err, results) {
        if (err) {
            logger.error('Failed with error: ' + err);
            return res.status(500).send('Unable to get relationships. Server error.');
        }
        else {
            if (options.includePagination) {
                logger.debug(`Success: Retrieved ${ results.data.length } of ${ results.pagination.total } total relationship(s)`);
            }
            else {
                logger.debug(`Success: Retrieved ${ results.length } relationship(s)`);
            }
            return res.status(200).send(results);
        }
    });
};

exports.retrieveById = function(req, res) {
    const options = {
        versions: req.query.versions || 'latest'
    }

    relationshipsService.retrieveById(req.params.stixId, options, function (err, relationships) {
        if (err) {
            if (err.message === relationshipsService.errors.badlyFormattedParameter) {
                logger.warn('Badly formatted stix id: ' + req.params.stixId);
                return res.status(400).send('Stix id is badly formatted.');
            }
            else if (err.message === relationshipsService.errors.invalidQueryStringParameter) {
                logger.warn('Invalid query string: versions=' + req.query.versions);
                return res.status(400).send('Query string parameter versions is invalid.');
            }
            else {
                logger.error('Failed with error: ' + err);
                return res.status(500).send('Unable to get relationships. Server error.');
            }
        }
        else {
            if (relationships.length === 0) {
                return res.status(404).send('Relationship not found.');
            }
            else {
                logger.debug(`Success: Retrieved ${ relationships.length } relationship(s) with id ${ req.params.stixId }`);
                return res.status(200).send(relationships);
            }
        }
    });
};

exports.retrieveVersionById = function(req, res) {
    relationshipsService.retrieveVersionById(req.params.stixId, req.params.modified, function (err, relationship) {
        if (err) {
            if (err.message === relationshipsService.errors.badlyFormattedParameter) {
                logger.warn('Badly formatted stix id: ' + req.params.stixId);
                return res.status(400).send('Stix id is badly formatted.');
            }
            else {
                logger.error('Failed with error: ' + err);
                return res.status(500).send('Unable to get relationship. Server error.');
            }
        } else {
            if (!relationship) {
                return res.status(404).send('Relationship not found.');
            }
            else {
                logger.debug(`Success: Retrieved relationship with id ${relationship.id}`);
                return res.status(200).send(relationship);
            }
        }
    });
};

exports.create = function(req, res) {
    // Get the data from the request
    const relationshipData = req.body;

    // Create the relationship
    relationshipsService.create(relationshipData, function(err, relationship) {
        if (err) {
            if (err.message === relationshipsService.errors.duplicateId) {
                logger.warn("Duplicate stix.id and stix.modified");
                return res.status(409).send('Unable to create relationship. Duplicate stix.id and stix.modified properties.');
            }
            else {
                logger.error("Failed with error: " + err);
                return res.status(500).send("Unable to create relationship. Server error.");
            }
        }
        else {
            logger.debug("Success: Created relationship with id " + relationship.stix.id);
            return res.status(201).send(relationship);
        }
    });
};

exports.updateFull = function(req, res) {
    // Get the data from the request
    const relationshipData = req.body;

    // Create the relationship
    relationshipsService.updateFull(req.params.stixId, req.params.modified, relationshipData, function(err, relationship) {
        if (err) {
            logger.error("Failed with error: " + err);
            return res.status(500).send("Unable to update relationship. Server error.");
        }
        else {
            if (!relationship) {
                return res.status(404).send('Relationship not found.');
            } else {
                logger.debug("Success: Updated relationship with id " + relationship.stix.id);
                return res.status(200).send(relationship);
            }
        }
    });
};

exports.delete = function(req, res) {
    relationshipsService.delete(req.params.stixId, req.params.modified, function (err, relationship) {
        if (err) {
            logger.error('Delete relationship failed. ' + err);
            return res.status(500).send('Unable to delete relationship. Server error.');
        }
        else {
            if (!relationship) {
                return res.status(404).send('Relationship not found.');
            } else {
                logger.debug("Success: Deleted relationship with id " + relationship.stix.id);
                return res.status(204).end();
            }
        }
    });
};
