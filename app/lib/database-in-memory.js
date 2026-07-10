const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const logger = require('./logger');

let mongod;

exports.initializeConnection = async function () {
  // Reuse a single MongoMemoryServer for all spec files in the process.
  // Starting a fresh mongod per spec file intermittently collides with a
  // port the previous instance has not fully released ("Port already in
  // use"), which fails the spec's before() hook and cascades failures
  // through that whole file.
  if (!mongod) {
    mongod = await MongoMemoryServer.create();
  }

  const uri = mongod.getUri();

  // Set `strictQuery` to `true` to omit unknown fields in queries.
  mongoose.set('strictQuery', true);

  // Configure mongoose to use ES6 promises
  mongoose.Promise = global.Promise;

  // Bootstrap db connection
  logger.info('Mongoose attempting to connect to in memory database at ' + uri);
  try {
    await mongoose.connect(uri);
  } catch (error) {
    handleError(error);
  }

  // Rebuild schema indexes for models compiled in an earlier spec file.
  // closeConnection drops the database (including its indexes), and
  // mongoose's per-model init() is memoized per process — without this,
  // unique-index constraints (e.g. stix.id + stix.modified) intermittently
  // vanish for later spec files.
  await Promise.all(Object.values(mongoose.models).map((model) => model.createIndexes()));

  logger.info('Mongoose connected to ' + uri);
};

exports.closeConnection = async function () {
  // Drop data and disconnect, but leave the mongod instance running for the
  // next spec file. The mocha scripts run with --exit, so the process does
  // not linger after the last spec.
  if (mongod && mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
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
