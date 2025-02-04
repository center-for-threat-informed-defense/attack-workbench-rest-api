// Tell config to read from a config file
process.env.JSON_CONFIG_PATH = './app/tests/config/test-config.json';

const { expect } = require('expect');

const config = require('../../config/config');
const markingDefinitionsService = require('../../services/marking-definitions-service');
const database = require('../../lib/database-in-memory');
const databaseConfiguration = require('../../lib/database-configuration');

describe('App Configuration', function () {
  before(async function () {
    // Establish the database connection
    // Use an in-memory database that we spin up for the test
    await database.initializeConnection();

    // Check for a valid database configuration
    await databaseConfiguration.checkSystemConfiguration();
  });

  it('The config values should be set by the config file', function (done) {
    // Defaults, not set by config file
    expect(config.app.env).toBe('development');
    expect(config.server.port).toBe(3000);

    // Set by config file
    expect(config.app.name).toBe('test-config');
    expect(config.collectionIndex.defaultInterval).toBe(100);
    expect(config.configurationFiles.staticMarkingDefinitionsPath).toBe(
      './app/tests/config/test-static-marking-definitions',
    );

    done();
  });

  it('The static marking definitions should be created', async function () {
    const options = {};
    const markingDefinitions = await markingDefinitionsService.retrieveAll(options);
    // We expect to get two marking definitions
    expect(markingDefinitions).toBeDefined();
    expect(Array.isArray(markingDefinitions)).toBe(true);
    expect(markingDefinitions.length).toBe(2);
  });

  after(async function () {
    await database.closeConnection();
  });
});
