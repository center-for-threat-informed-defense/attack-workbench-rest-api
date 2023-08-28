'use strict';

const collectionIndexService = require('../services/collection-indexes-service');
const logger = require('../lib/logger');

exports.retrieveAll = function(req, res) {
    const options = {
        offset: req.query.offset || 0,
        limit: req.query.limit || 0
    }

    collectionIndexService.retrieveAll(options, function(err, collectionIndexes) {
        if (err) {
            logger.error('Failed with error: ' + err);
            return res.status(500).send('Unable to get collection indexes. Server error.');
        }
        else {
            logger.debug(`Success: Retrieved ${ collectionIndexes.length } collectionIndex(es)`);
            return res.status(200).send(collectionIndexes);
        }
    });
};

exports.retrieveById = function(req, res) {
    // Get the id from the request
    const id = req.params.id;

    collectionIndexService.retrieveById(id, function (err, collectionIndex) {
        if (err) {
            if (err.message === collectionIndexService.errors.badlyFormattedParameter) {
                logger.warn('Badly formatted id: ' + id);
                return res.status(400).send('Id is badly formatted.');
            }
            else {
                logger.error('Failed with error: ' + err);
                return res.status(500).send('Unable to get collection index. Server error.');
            }
        }
        else {
            if (collectionIndex) {
                return res.status(200).send(collectionIndex);
            }
            else {
                return res.status(404).send('Collection Index not found.');
            }
        }
    });
};

exports.create = function(req, res) {
    // Get the data from the request
    const collectionIndexData = req.body;

    // The collection index must have an id.
    if (!collectionIndexData.collection_index.id) {
        logger.warn('Create collection index failed: Missing id');
        return res.status(400).send('Unable to create collection index. Missing id.');
    }

    // Create the collection index
    collectionIndexService.create(collectionIndexData, function(err, collectionIndex) {
        if (err) {
            if (err.message === collectionIndexService.errors.duplicateId) {
                logger.warn("Create collection index failed: Duplicate id");
                return res.status(409).send('Unable to create collection index. Duplicate id.');
            }
            else {
                logger.error("Create collection index failed with error: " + err);
                return res.status(500).send("Unable to create collection index. Server error.");
            }
        }
        else {
            logger.debug("Success: Created collection index with id " + collectionIndex.collection_index.id);
            return res.status(201).send(collectionIndex);
        }
    });
};

exports.updateFull = function(req, res) {
    // Get the data and id from the request
    const collectionIndexData = req.body;
    const id = req.params.id;

    if (!id) {
        logger.error('Delete collection index failed with error: Missing id');
        return res.status(400).send('Unable to delete collection index. Missing id.')
    }

    // Update the collection index
    collectionIndexService.updateFull(id, collectionIndexData, function(err, collectionIndex) {
        if (err) {
            logger.error("Update collection index failed with error: " + err);
            return res.status(500).send("Unable to update collection index. Server error.");
        }
        else {
            if (!collectionIndex) {
                return res.status(404).send('Collection index not found.');
            } else {
                logger.debug('Success: Updated collection index.');
                return res.status(200).send(collectionIndex);
            }
        }
    });
};

exports.delete = function(req, res) {
    // Get the id from the request
    const id = req.params.id;

    if (!id) {
        logger.error('Delete collection index failed with error: Missing id');
        return res.status(400).send('Unable to delete collection index. Missing id.')
    }

    // Delete the collection index
    collectionIndexService.delete(id, function (err, collectionIndex) {
        if (err) {
            logger.error('Delete collection index failed with error: ' + err);
            return res.status(500).send('Unable to delete collection index. Server error.');
        }
        else {
            if (!collectionIndex) {
                return res.status(404).send('Collection index not found.');
            } else {
                logger.debug('Success: Deleted collection index.');
                return res.status(204).end();
            }
        }
    });
};

exports.refresh = function(req, res) {
    const id = req.params.id;

    if (!id) {
        logger.warn('Refresh collection index failed with error: Missing id');
        return res.status(400).send('Unable to refresh collection index. Missing id.')
    }

    collectionIndexService.refresh(id, function(err, collectionIndex) {
        if (err) {
            logger.error('Failed with error: ' + err);
            return res.status(500).send('Unable to refresh collection index. Server error.');
        }
        else {
            logger.debug("Success: Refreshed collection index");
            return res.status(200).send(collectionIndex);
        }
    });
};
