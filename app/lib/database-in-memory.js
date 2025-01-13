const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const logger = require('./logger');

let mongod;

exports.initializeConnection = async function () {
  if (!mongod) {
    mongod = await MongoMemoryServer.create();
  }

  const uri = mongod.getUri();

  // Configure mongoose to use ES6 promises
  mongoose.Promise = global.Promise;

  // Bootstrap db connection
  logger.info('Mongoose attempting to connect to in memory database at ' + uri);
  try {
    await mongoose.connect(uri);
  } catch (error) {
    handleError(error);
  }
  logger.info('Mongoose connected to ' + uri);
};

exports.closeConnection = async function () {
  if (mongod) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongod.stop();

    mongod = null;
  }
};

exports.clearDatabase = async function () {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
};

function handleError(error) {
  logger.warn('Mongoose connection error: ' + error);
  logger.warn('Database (mongoose) connection is required. Terminating app.');

  // Terminate the app
  process.exit(1);
}
