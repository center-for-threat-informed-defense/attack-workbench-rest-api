#!/bin/node

/**
 * This script removes all objects from the attackObjects and references collections in the ATT&CK Workbench database.
 * It does not remove objects from the useraccounts, systemconfigurations, or collectionIndexes collections.
 *
 * It requires the database URL to be provided in the DATABASE_URL environment variable.
 *
 * Usage:
 *   DATABASE_URL=mongodb://localhost/attack-workspace node ./scripts/clearDatabase.js
 *
 */

'use strict';

const AttackObject = require('../app/models/attack-object-model');
const Relationship = require('../app/models/relationship-model');
const Reference = require('../app/models/reference-model');

async function clearDatabase() {
  // Establish the database connection
  console.log('Setting up the database connection');
  await require('../app/lib/database-connection').initializeConnection();

  let result = await AttackObject.deleteMany();
  console.log(`Deleted ${result.deletedCount} objects from the attackObjects collection.`);

  result = await Relationship.deleteMany();
  console.log(`Deleted ${result.deletedCount} objects from the relationships collection.`);

  result = await Reference.deleteMany();
  console.log(`Deleted ${result.deletedCount} objects from the references collection.`);
}

clearDatabase()
  .then(() => process.exit())
  .catch((err) => {
    console.log('clearDatabase() - Error: ' + err);
    process.exit(1);
  });
