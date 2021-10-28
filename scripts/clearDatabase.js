'use strict';

const AttackObject = require('../app/models/attack-object-model');
const Reference = require('../app/models/reference-model');

async function clearDatabase() {
    // Establish the database connection
    console.log('Setting up the database connection');
    await require('../app/lib/database-connection').initializeConnection();

    let result = await AttackObject.deleteMany();
    console.log(`Deleted ${ result.deletedCount } objects from the attackObjects collection.`);

    result = await Reference.deleteMany();
    console.log(`Deleted ${ result.deletedCount } objects from the references collection.`);
}

clearDatabase();
