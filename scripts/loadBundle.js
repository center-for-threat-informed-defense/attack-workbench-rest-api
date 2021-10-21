'use strict';

const collectionBundleService = require('../app/services/collection-bundles-service');
const { promises: fs } = require("fs");

async function readJson(path) {
    const filePath = require.resolve(path);
    const data = await fs.readFile(filePath);
    return JSON.parse(data);
}

async function loadBundle() {
    // Establish the database connection
    console.log('Setting up the database connection');
    await require('../app/lib/database-connection').initializeConnection();

    // const bundle = await readJson('../app/tests/import/enterprise-attack-7.2.json');
    // const bundle = await readJson('../app/tests/import/enterprise-attack-8.2.json');
    // const bundle = await readJson('../app/tests/import/enterprise-attack-9.0.json');
    const bundle = await readJson('../app/tests/import/enterprise-attack-9.0-with-mock-data-sources-collection.json');
    const options = {};

    // Find the x-mitre-collection objects
    const collections = bundle.objects.filter(object => object.type === 'x-mitre-collection');

    // The bundle must have an x-mitre-collection object
    if (collections.length === 0) {
        console.warn("Unable to import collection bundle. Missing x-mitre-collection object.");
        throw(new Error('Unable to import collection bundle. Missing x-mitre-collection object.'));
    }
    else if (collections.length > 1) {
        console.warn("Unable to import collection bundle. More than one x-mitre-collection object.");
        throw(new Error('Unable to import collection bundle. More than one x-mitre-collection object.'));

    }

    // The collection must have an id.
    if (!collections[0].id) {
        console.warn('Unable to import collection bundle. x-mitre-collection missing id');
        throw(new Error('Unable to import collection bundle. x-mitre-collection missing id'));
    }

    console.log('Importing bundle into database...')
    collectionBundleService.importBundle(collections[0], bundle, options, function(err, importedCollection) {
        if (err) {
            throw err;
        }
        else {
            console.log('Bundle imported');
        }
    });
}

loadBundle();
