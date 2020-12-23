'use strict';

const groupsService = require('../services/groups-service');
const logger = require('../lib/logger');

exports.retrieveAll = function(req, res) {
    groupsService.retrieveAll(function(err, groups) {
        if (err) {
            logger.error('Failed with error: ' + err);
            return res.status(500).send('Unable to get groups. Server error.');
        }
        else {
            logger.debug(`Success: Retrieved ${ groups.length } group(s)`);
            return res.status(200).send(groups);
        }
    });
};

exports.retrieveById = function(req, res) {
    const versions = req.query.versions || 'latest';

    groupsService.retrieveById(req.params.stixId, versions, function (err, groups) {
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
            logger.debug(`Success: Retrieved ${ groups.length } group(s) with id ${ req.params.stixId }`);
            return res.status(200).send(groups);
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

exports.create = function(req, res) {
    // Get the data from the request
    const groupData = req.body;

    // Create the group
    groupsService.create(groupData, function(err, group) {
        if (err) {
            if (err.message === groupsService.errors.duplicateId) {
                logger.warn("Duplicate stix.id and stix.modified");
                return res.status(409).send('Unable to create group. Duplicate stix.id and stix.modified properties.');
            }
            else {
                logger.error("Failed with error: " + err);
                return res.status(500).send("Unable to create group. Server error.");
            }
        }
        else {
            logger.debug("Success: Created group with id " + group.stix.id);
            return res.status(201).send(group);
        }
    });
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
