'use strict';

const relationshipsService = require('../services/relationships-service');
const logger = require('../lib/logger');

exports.retrieveAll = async function(req, res) {
    const options = {
        offset: req.query.offset || 0,
        limit: req.query.limit || 0,
        state: req.query.state,
        includeRevoked: req.query.includeRevoked,
        includeDeprecated: req.query.includeDeprecated,
        sourceRef: req.query.sourceRef,
        targetRef: req.query.targetRef,
        sourceOrTargetRef: req.query.sourceOrTargetRef,
        relationshipType: req.query.relationshipType,
        sourceType: req.query.sourceType,
        targetType: req.query.targetType,
        versions: req.query.versions || 'latest',
        includePagination: req.query.includePagination,
        lookupRefs: req.query.lookupRefs,
        includeIdentities: req.query.includeIdentities,
        users: req.query.users
    }

    try {
        const results = await relationshipsService.retrieveAll(options);
        if (options.includePagination) {
            logger.debug(`Success: Retrieved ${results.data.length} of ${results.pagination.total} total relationship(s)`);
        }
        else {
            logger.debug(`Success: Retrieved ${results.length} relationship(s)`);
        }
        return res.status(200).send(results);
    }
    catch(err) {
        logger.error('Failed with error: ' + err);
        return res.status(500).send('Unable to get relationships. Server error.');
    }
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

exports.create = async function(req, res) {
    // Get the data from the request
    const relationshipData = req.body;

    // Create the relationship
    try {
        const options = {
            import: false,
            userAccountId: req.user?.userAccountId
        };
        const relationship = await relationshipsService.create(relationshipData, options);
        logger.debug("Success: Created relationship with id " + relationship.stix.id);
        return res.status(201).send(relationship);
    }
    catch(err) {
        if (err.message === relationshipsService.errors.duplicateId) {
            logger.warn("Duplicate stix.id and stix.modified");
            return res.status(409).send('Unable to create relationship. Duplicate stix.id and stix.modified properties.');
        }
        else {
            logger.error("Failed with error: " + err);
            return res.status(500).send("Unable to create relationship. Server error.");
        }
    }
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

exports.deleteVersionById = function(req, res) {
    relationshipsService.deleteVersionById(req.params.stixId, req.params.modified, function (err, relationship) {
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

exports.deleteById = function(req, res) {
    relationshipsService.deleteById(req.params.stixId, function (err, relationships) {
        if (err) {
            logger.error('Delete relationship failed. ' + err);
            return res.status(500).send('Unable to delete relationship. Server error.');
        }
        else {
            if (relationships.deletedCount === 0) {
                return res.status(404).send('Relationship not found.');
            }
            else {
                logger.debug(`Success: Deleted relationship with id ${ req.params.stixId }`);
                return res.status(204).end();
            }
        }
    });
};
