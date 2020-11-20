const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const logger = require('./logger');

const mongod = new MongoMemoryServer();

exports.initializeConnection = async function() {
    const uri = await mongod.getUri();

    // Configure mongoose to use ES6 promises
    mongoose.Promise = global.Promise;

    // Tell mongoose to use the native mongoDB findOneAndUpdate() function
    mongoose.set('useFindAndModify', false);

    // Tell mongoose to use createIndex() instead of ensureIndex()
    mongoose.set('useCreateIndex', true);

    // Bootstrap db connection
    logger.info('Mongoose attempting to connect to in memory database at ' + uri);
    try {
        await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    } catch (error) {
        handleError(error);
    }
    logger.info('Mongoose connected to ' + uri);
}

exports.closeConnection = async function() {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongod.stop();
}

exports.clearDatabase = async function() {
    const collections = mongoose.connection.collections;

    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany();
    }
}

function handleError(error) {
    logger.warn('Mongoose connection error: ' + error);
    logger.warn('Database (mongoose) connection is required. Terminating app.');

    // Terminate the app
    process.exit(1);
}
