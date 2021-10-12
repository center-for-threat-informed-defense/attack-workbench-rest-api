'use strict';

const collectionBundlesService = require('../services/collection-bundles-service');
const logger = require('../lib/logger');

const availableForceImportParameters = [
    collectionBundlesService.forceImportParameters.attackSpecVersionViolations,
    collectionBundlesService.forceImportParameters.duplicateCollection
];

function extractForceImportParameters(req) {
    const params = [];
    if (req.query.forceImport) {
        if (Array.isArray(req.query.forceImport)) {
            params.push(...req.query.forceImport);
        }
        else {
            params.push(req.query.forceImport);
        }

        if (params.find(param => param === 'all')) {
            return availableForceImportParameters;
        }
    }

    return params;
}

exports.importBundle = function(req, res) {
    // Get the data from the request
    const collectionBundleData = req.body;

    const forceImportParameters = extractForceImportParameters(req);

    // Find the x-mitre-collection objects
    const collections = collectionBundleData.objects.filter(object => object.type === 'x-mitre-collection');

    // The bundle must have an x-mitre-collection object
    if (collections.length === 0) {
        logger.warn("Unable to import collection bundle. Missing x-mitre-collection object.");
        return res.status(400).send('Unable to import collection bundle. Missing x-mitre-collection object.');
    }
    else if (collections.length > 1) {
        logger.warn("Unable to import collection bundle. More than one x-mitre-collection object.");
        return res.status(400).send('Unable to import collection bundle. More than one x-mitre-collection object.');
    }

    // The collection must have an id.
    if (!collections[0].id) {
        logger.warn('Unable to import collection bundle. x-mitre-collection missing id');
        return res.status(400).send('Unable to import collection bundle. x-mitre-collection missing id.');
    }

    const validationResult = collectionBundlesService.validateBundle(collectionBundleData);
    if (validationResult.errors.length > 0) {
        logger.warn('Unable to import collection bundle. Validation failed');
        return res.status(400).send('Unable to import collection, validation failed.');
    }

    const options = {
        previewOnly: req.query.previewOnly || req.query.checkOnly,
        forceImportParameters
    }

    // Import the collection bundle
    collectionBundlesService.importBundle(collections[0], collectionBundleData, options, function(err, importedCollection) {
        if (err) {
            if (err.message === collectionBundlesService.errors.duplicateCollection) {
                logger.error('Unable to import collection, duplicate x-mitre-collection.');
                return res.status(400).send('Unable to import collection, duplicate x-mitre-collection.');
            }
            else if (err.message === collectionBundlesService.errors.attackSpecVersionViolation) {
                logger.error('Unable to import collection, ATT&CK Spec version violation.');
                return res.status(409).send('Unable to import collection, ATT&CK Spec version violation.');
            }
            else {
                logger.error("Unable to import collection, create collection index failed with error: " + err);
                return res.status(500).send("Unable to import collection, unable to create collection index. Server error.");
            }
        }
        else {
            if (req.query.checkOnly) {
                logger.debug("Success: Previewed import of collection with id " + importedCollection.stix.id);
                return res.status(201).send(importedCollection);
            }
            else {
                logger.debug("Success: Imported collection with id " + importedCollection.stix.id);
                return res.status(201).send(importedCollection);
            }
        }
    });
};

exports.exportBundle = function(req, res) {
    if (req.query.collectionModified && !req.query.collectionId) {
        return res.status(400).send('collectionId is required when providing collectionModified');
    }

    const options = {
        collectionId: req.query.collectionId,
        collectionModified: req.query.collectionModified,
        previewOnly: req.query.previewOnly
    };

    collectionBundlesService.exportBundle(options, function(err, collectionBundle) {
        if (err) {
            if (err.message === collectionBundlesService.errors.notFound) {
                return res.status(404).send('Collection not found');
            }
            else {
                logger.error('Unable to export collection: ' + err);
                return res.status(500).send('Unable to export collection.');
            }
        }
        else {
            return res.status(200).send(collectionBundle);
        }
    })
}

