// Tell config to read from a config file
process.env.JSON_CONFIG_PATH = './app/tests/config/test-config.json';

const config = require('../../config/config');
const expect = require('expect');

describe('App Configuration', function () {
    it('The config values should be set by the config file', async function() {
        // Defaults, not set by config file
        expect(config.app.env).toBe('development');
        expect(config.server.port).toBe(3000);

        // Set by config file
        expect(config.app.name).toBe('test-config');
        expect(config.collectionIndex.defaultInterval).toBe(100);
    });
});
