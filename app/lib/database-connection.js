'use strict';

exports.initializeConnection = async function (options) {
  const logger = require('./logger');
  const config = require('../config/config');

  const databaseUrl = options?.databaseUrl || config.database.url;

  if (!databaseUrl) {
    throw new Error(
      'The URL for the MongoDB database was not set in the DATABASE_URL environment variable.',
    );
  }

  const mongoose = require('mongoose');

  // Set `strictQuery` to `true` to omit unknown fields in queries.
  mongoose.set('strictQuery', true);

  // Configure mongoose to use ES6 promises
  mongoose.Promise = global.Promise;

  // Bootstrap db connection
  logger.info('Mongoose attempting to connect to ' + databaseUrl);
  await mongoose.connect(databaseUrl);

  logger.info('Mongoose connected to ' + databaseUrl);
};
