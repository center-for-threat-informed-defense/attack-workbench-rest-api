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

    const errorResult = {
        bundleErrors: {
            noCollection: false,
            moreThanOneCollection: false,
            duplicateCollection: false,
            badlyFormattedCollection: false
        },
        objectErrors: {
            summary: {
                duplicateObjectInBundleCount: 0,
                invalidAttackSpecVersionCount: 0
            },
            errors: []
        }
    };
    let errorFound = false;

    // Find the x-mitre-collection objects
    const collections = collectionBundleData.objects.filter(object => object.type === 'x-mitre-collection');

    // The bundle must have an x-mitre-collection object
    if (collections.length === 0) {
        logger.warn("Collection bundle is missing x-mitre-collection object.");
        errorResult.bundleErrors.noCollection = true;
        errorFound = true;
    }
    else if (collections.length > 1) {
        logger.warn("Collection bundle has more than one x-mitre-collection object.");
        errorResult.bundleErrors.moreThanOneCollection = true;
        errorFound = true;
    }

    // The collection must have an id.
    if (collections.length > 0 && !collections[0].id) {
        logger.warn('Badly formatted collection in bundle, x-mitre-collection missing id.');
        errorResult.bundleErrors.badlyFormattedCollection = true;
        errorFound = true;
    }

    const validationResult = collectionBundlesService.validateBundle(collectionBundleData);
    if (validationResult.errors.length > 0) {
        errorFound = true;
        if (validationResult.duplicateObjectInBundleCount > 0) {
            logger.warn(`Collection bundle has ${ validationResult.duplicateObjectInBundleCount } duplicate objects.`);
            errorResult.objectErrors.summary.duplicateObjectInBundleCount = validationResult.duplicateObjectInBundleCount;
        }

        if (validationResult.invalidAttackSpecVersionCount > 0) {
            logger.warn(`Collection bundle has ${ validationResult.invalidAttackSpecVersionCount } objects with invalid ATT&CK Spec Versions.`);
            errorResult.objectErrors.summary.invalidAttackSpecVersionCount = validationResult.invalidAttackSpecVersionCount;
        }

        errorResult.objectErrors.errors.push(...validationResult.errors);
    }

    if (errorFound) {
        // Determine if any of the errors are overridden by the forceImport flag

        // These errors do not have forceImport flags yet
        if (errorResult.bundleErrors.noCollection ||
            errorResult.bundleErrors.moreThanOneCollection ||
            errorResult.bundleErrors.badlyFormattedCollection ||
            errorResult.objectErrors.summary.duplicateObjectInBundleCount > 0) {
            logger.error('Unable to import collection bundle due to an error in the bundle.');
            return res.status(400).send(errorResult);
        }

        // Check the forceImport flag for overriding ATT&CK Spec version violations
        if (errorResult.objectErrors.summary.invalidAttackSpecVersionCount > 0 &&
        !forceImportParameters.find(e => e === collectionBundlesService.forceImportParameters.attackSpecVersionViolations)) {
            logger.error('Unable to import collection bundle due to an error in the bundle.');
            return res.status(400).send(errorResult);
        }
    }

    const options = {
        previewOnly: req.query.previewOnly || req.query.checkOnly,
        forceImportParameters
    }

    // Import the collection bundle
    collectionBundlesService.importBundle(collections[0], collectionBundleData, options, function(err, importedCollection) {
        if (err) {
            if (err.message === collectionBundlesService.errors.duplicateCollection) {
                errorResult.bundleErrors.duplicateCollection = true;
                logger.error('Unable to import collection, duplicate x-mitre-collection.');
                return res.status(400).send(errorResult);
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

exports.exportBundle = async function(req, res) {
    if (req.query.collectionModified && !req.query.collectionId) {
        return res.status(400).send('collectionId is required when providing collectionModified');
    }

    const options = {
        collectionId: req.query.collectionId,
        collectionModified: req.query.collectionModified,
        previewOnly: req.query.previewOnly
    };

    try {
        const collectionBundle = await collectionBundlesService.exportBundle(options);
        return res.status(200).send(collectionBundle);
    }
    catch(err) {
        if (err.message === collectionBundlesService.errors.notFound) {
            return res.status(404).send('Collection not found');
        }
        else {
            logger.error('Unable to export collection: ' + err);
            return res.status(500).send('Unable to export collection.');
        }
    }
}

