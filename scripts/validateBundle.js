#!/bin/node

/**
 * This script validates a collection bundle.
 *
 * The filename and directory of the collection bundle to validate are currently hardcoded in this script.
 *
 * Usage:
 *   node ./scripts/validateBundle.js
 *
 */

'use strict';

const collectionBundleService = require('../app/services/collection-bundles-service');
const { promises: fs } = require("fs");

async function readJson(path) {
    const filePath = require.resolve(path);
    const data = await fs.readFile(filePath);
    return JSON.parse(data);
}

async function validateBundle() {
    const filename = 'ics-attack-10.1.json';

    const collectionBundlesDirectory = '../app/tests/import/test-files';
    const filePath = collectionBundlesDirectory + '/' + filename;
    const bundle = await readJson(filePath);

    const options = {};

    // Find the x-mitre-collection objects
    const collections = bundle.objects.filter(object => object.type === 'x-mitre-collection');

    // The bundle must have an x-mitre-collection object
    if (collections.length === 0) {
        console.warn("Unable to validate collection bundle. Missing x-mitre-collection object.");
        throw(new Error('Unable to validate collection bundle. Missing x-mitre-collection object.'));
    }
    else if (collections.length > 1) {
        console.warn("Unable to validate collection bundle. More than one x-mitre-collection object.");
        throw(new Error('Unable to validate collection bundle. More than one x-mitre-collection object.'));
    }

    // The collection must have an id.
    if (!collections[0].id) {
        console.warn('Unable to validate collection bundle. x-mitre-collection missing id');
        throw(new Error('Unable to validate collection bundle. x-mitre-collection missing id'));
    }

    console.log('Validating bundle...');
    const validationResult = collectionBundleService.validateBundle(bundle, options);
    console.log(JSON.stringify(validationResult, null, 2));
}

validateBundle()
    .then(() => process.exit())
    .catch(err => {
        console.log('validateBundle() - Error: ' + err);
        process.exit(1);
    });
