#!/bin/node

/**
 * This script loads a collection bundle into the ATT&CK Workbench database.
 *
 * It requires the database URL to be provided in the DATABASE_URL environment variable.
 *
 * The filename and directory of the collection bundle to load are currently hardcoded in this script.
 *
 * Usage:
 *   DATABASE_URL=mongodb://localhost/attack-workspace node ./scripts/loadBundle.js
 *
 */

'use strict';

const collectionBundleService = require('../app/services/collection-bundles-service');
const { promises: fs } = require('fs');

async function readJson(path) {
  const filePath = require.resolve(path);
  const data = await fs.readFile(filePath);
  return JSON.parse(data);
}

async function loadBundle() {
  // Establish the database connection
  console.log('Setting up the database connection');
  await require('../app/lib/database-connection').initializeConnection();

  const filename = 'mobile-attack-10.0.json';

  const collectionBundlesDirectory = '../app/tests/import/test-files';
  const filePath = collectionBundlesDirectory + '/' + filename;
  const bundle = await readJson(filePath);

  const options = {};

  // Find the x-mitre-collection objects
  const collections = bundle.objects.filter((object) => object.type === 'x-mitre-collection');

  // The bundle must have an x-mitre-collection object
  if (collections.length === 0) {
    console.warn('Unable to import collection bundle. Missing x-mitre-collection object.');
    throw new Error('Unable to import collection bundle. Missing x-mitre-collection object.');
  } else if (collections.length > 1) {
    console.warn('Unable to import collection bundle. More than one x-mitre-collection object.');
    throw new Error('Unable to import collection bundle. More than one x-mitre-collection object.');
  }

  // The collection must have an id.
  if (!collections[0].id) {
    console.warn('Unable to import collection bundle. x-mitre-collection missing id');
    throw new Error('Unable to import collection bundle. x-mitre-collection missing id');
  }

  console.log('Importing bundle into database...');
  return new Promise((resolve, reject) => {
    collectionBundleService.importBundle(
      collections[0],
      bundle,
      options,
      (err, importedCollection) => {
        if (err) {
          reject(err);
        } else {
          console.log('Bundle imported');
          resolve();
        }
      },
    );
  });
}

loadBundle()
  .then(() => process.exit())
  .catch((err) => {
    console.log('loadBundle() - Error: ' + err);
    process.exit(1);
  });
