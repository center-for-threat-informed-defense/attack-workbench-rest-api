'use strict';

const collectionsService = require('../services/collections-service');
const logger = require('../lib/logger');

exports.retrieveAll = function(req, res) {
    const options = {
        offset: req.query.offset || 0,
        limit: req.query.limit || 0,
        state: req.query.state,
        includeRevoked: req.query.includeRevoked,
        includeDeprecated: req.query.includeDeprecated
    }

    collectionsService.retrieveAll(options, function(err, collections) {
        if (err) {
            logger.error('Failed with error: ' + err);
            return res.status(500).send('Unable to get collections. Server error.');
        }
        else {
            logger.debug(`Success: Retrieved ${ collections.length } collection(s)`);
            return res.status(200).send(collections);
        }
    });
};

exports.retrieveById = function(req, res) {
    const versions = req.query.versions || 'latest';

    collectionsService.retrieveById(req.params.stixId, versions, function (err, collections) {
        if (err) {
            if (err.message === collectionsService.errors.badlyFormattedParameter) {
                logger.warn('Badly formatted stix id: ' + req.params.stixId);
                return res.status(400).send('Stix id is badly formatted.');
            }
            else if (err.message === collectionsService.errors.invalidQueryStringParameter) {
                logger.warn('Invalid query string: versions=' + req.query.versions);
                return res.status(400).send('Query string parameter versions is invalid.');
            }
            else {
                logger.error('Failed with error: ' + err);
                return res.status(500).send('Unable to get collections. Server error.');
            }
        }
        else {
            if (collections.length === 0) {
                return res.status(404).send('Collection not found.');
            }
            else {
                logger.debug(`Success: Retrieved ${ collections.length } collection(s) with id ${ req.params.stixId }`);
                return res.status(200).send(collections);
            }
        }
    });
};

exports.create = function(req, res) {
    // Get the data from the request
    const collectionData = req.body;

    // The collection must have an id.
    if (collectionData.stix && !collectionData.stix.id) {
        logger.warn('Create collection failed: Missing id');
        return res.status(400).send('Unable to create collection. Missing id.');
    }

    // Create the collection
    collectionsService.create(collectionData, function(err, collection) {
        if (err) {
            if (err.message === collectionsService.errors.duplicateId) {
                logger.warn("Duplicate stix.id and stix.modified");
                return res.status(409).send('Unable to create technique. Duplicate stix.id and stix.modified properties.');
            }
            else {
                logger.error("Failed with error: " + err);
                return res.status(500).send("Unable to create technique. Server error.");
            }
        }
        else {
            logger.debug("Success: Created technique with id " + collection.stix.id);
            return res.status(201).send(collection);
        }
    });
};

exports.delete = function(req, res) {
    collectionsService.delete(req.params.stixId, req.query.deleteAllContents, function (err, removedCollections) {
        if (err) {
            logger.error('Delete collections failed. ' + err);
            return res.status(500).send('Unable to delete collections. Server error.');
        }
        else {
            if (removedCollections.length === 0) {
                return res.status(404).send('Collection not found.');
            } else {
                logger.debug("Success: Deleted collection with id " + removedCollections[0].id);
                return res.status(204).end();
            }
        }
    });
};
