'use strict';

const groupsService = require('../services/groups-service');
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

    groupsService.retrieveAll(options, function(err, results) {
        if (err) {
            logger.error('Failed with error: ' + err);
            return res.status(500).send('Unable to get groups. Server error.');
        }
        else {
            if (options.includePagination) {
                logger.debug(`Success: Retrieved ${ results.data.length } of ${ results.pagination.total } total group(s)`);
            }
            else {
                logger.debug(`Success: Retrieved ${ results.length } group(s)`);
            }
            return res.status(200).send(results);
        }
    });
};

exports.retrieveById = function(req, res) {
    const options = {
        versions: req.query.versions || 'latest'
    }

    groupsService.retrieveById(req.params.stixId, options, function (err, groups) {
        if (err) {
            if (err.message === groupsService.errors.badlyFormattedParameter) {
                logger.warn('Badly formatted stix id: ' + req.params.stixId);
                return res.status(400).send('Stix id is badly formatted.');
            }
            else if (err.message === groupsService.errors.invalidQueryStringParameter) {
                logger.warn('Invalid query string: versions=' + req.query.versions);
                return res.status(400).send('Query string parameter versions is invalid.');
            }
            else {
                logger.error('Failed with error: ' + err);
                return res.status(500).send('Unable to get groups. Server error.');
            }
        }
        else {
            if (groups.length === 0) {
                return res.status(404).send('Group not found.');
            }
            else {
                logger.debug(`Success: Retrieved ${ groups.length } group(s) with id ${ req.params.stixId }`);
                return res.status(200).send(groups);
            }
        }
    });
};

exports.retrieveVersionById = function(req, res) {
    groupsService.retrieveVersionById(req.params.stixId, req.params.modified, function (err, group) {
        if (err) {
            if (err.message === groupsService.errors.badlyFormattedParameter) {
                logger.warn('Badly formatted stix id: ' + req.params.stixId);
                return res.status(400).send('Stix id is badly formatted.');
            }
            else {
                logger.error('Failed with error: ' + err);
                return res.status(500).send('Unable to get group. Server error.');
            }
        } else {
            if (!group) {
                return res.status(404).send('Group not found.');
            }
            else {
                logger.debug(`Success: Retrieved group with id ${group.id}`);
                return res.status(200).send(group);
            }
        }
    });
};

exports.create = async function(req, res) {
    // Get the data from the request
    const groupData = req.body;

    // Create the group
    try {
        const options = {
            import: false,
            userAccountId: req.user?.userAccountId
        };

        const group = await groupsService.create(groupData, options);
        logger.debug('Success: Created group with id ' + group.stix.id);
        return res.status(201).send(group);
    }
    catch(err) {
        if (err.message === groupsService.errors.duplicateId) {
            logger.warn('Duplicate stix.id and stix.modified');
            return res.status(409).send('Unable to create group. Duplicate stix.id and stix.modified properties.');
        }
        else if (err.message === groupsService.errors.invalidType) {
            logger.warn('Invalid stix.type');
            return res.status(400).send('Unable to create group. stix.type must be intrusion-set');
        }
        else {
            logger.error('Failed with error: ' + err);
            return res.status(500).send('Unable to create group. Server error.');
        }
    }
};

exports.updateFull = function(req, res) {
    // Get the data from the request
    const groupData = req.body;

    // Create the group
    groupsService.updateFull(req.params.stixId, req.params.modified, groupData, function(err, group) {
        if (err) {
            logger.error("Failed with error: " + err);
            return res.status(500).send("Unable to update group. Server error.");
        }
        else {
            if (!group) {
                return res.status(404).send('Group not found.');
            } else {
                logger.debug("Success: Updated group with id " + group.stix.id);
                return res.status(200).send(group);
            }
        }
    });
};

exports.delete = function(req, res) {
    groupsService.delete(req.params.stixId, req.params.modified, function (err, group) {
        if (err) {
            logger.error('Delete group failed. ' + err);
            return res.status(500).send('Unable to delete group. Server error.');
        }
        else {
            if (!group) {
                return res.status(404).send('Group not found.');
            } else {
                logger.debug("Success: Deleted group with id " + group.stix.id);
                return res.status(204).end();
            }
        }
    });
};
