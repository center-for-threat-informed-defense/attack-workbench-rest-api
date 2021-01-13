'use strict';

const collectionBundlesService = require('../services/collection-bundles-service');
const logger = require('../lib/logger');

exports.import = function(req, res) {
    // Get the data from the request
    const collectionBundleData = req.body;

    // Find the x-mitre-collection object
    const collection = collectionBundleData.objects.find(object => object.type === 'x-mitre-collection');

    // The bundle must have an x-mitre-collection object
    if (!collection) {
        logger.warn("Unable to import collection bundle. Missing x-mitre-collection object.");
        return res.status(400).send('Unable to import collection bundle. Missing x-mitre-collection object.');
    }

    // The collection must have an id.
    if (!collection.id) {
        logger.warn('Unable to import collection bundle. x-mitre-collection missing id');
        return res.status(400).send('Unable to import collection bundle. x-mitre-collection missing id.');
    }

    // Create the collection index
    collectionBundlesService.import(collection, collectionBundleData, req.query.checkOnly, function(err, importedCollection) {
        if (err) {
            logger.error("Create collection index failed with error: " + err);
            return res.status(500).send("Unable to create collection index. Server error.");
        }
        else {
            logger.debug("Success: Imported collection with id " + importedCollection.stix.id);
            return res.status(201).send(importedCollection);
        }
    });
};

