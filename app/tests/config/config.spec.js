// Tell config to read from a config file
process.env.JSON_CONFIG_PATH = './app/tests/config/test-config.json';

const { expect } = require('expect');

const config = require('../../config/config');
const markingDefinitionsService = require('../../services/marking-definitions-service');
const database = require('../../lib/database-in-memory');
const databaseConfiguration = require('../../lib/database-configuration');

describe('App Configuration', function () {
    before(async function() {
        // Establish the database connection
        // Use an in-memory database that we spin up for the test
        await database.initializeConnection();

        // Check for a valid database configuration
        await databaseConfiguration.checkSystemConfiguration();
    });

    it('The config values should be set by the config file', function(done) {
        // Defaults, not set by config file
        expect(config.app.env).toBe('development');
        expect(config.server.port).toBe(3000);

        // Set by config file
        expect(config.app.name).toBe('test-config');
        expect(config.collectionIndex.defaultInterval).toBe(100);
        expect(config.configurationFiles.staticMarkingDefinitionsPath).toBe('./app/tests/config/test-static-marking-definitions');

        done();
    });

    describe('CORS Configuration', function () {
        it('should accept wildcard origin', function () {
            const testConfig = {
                server: { corsAllowedOrigins: '*' }
            };
            expect(() => config.reloadConfig()).not.toThrow();
            expect(config.server.corsAllowedOrigins).toStrictEqual(['*']);
        });

        it('should accept disable option', function () {
            process.env.CORS_ALLOWED_ORIGINS = 'disable';
            expect(() => config.reloadConfig()).not.toThrow();
            expect(config.server.corsAllowedOrigins).toStrictEqual(['disable']);
            delete process.env.CORS_ALLOWED_ORIGINS;
        });

        it('should accept valid single domain', function () {
            process.env.CORS_ALLOWED_ORIGINS = 'example.com';
            expect(() => config.reloadConfig()).not.toThrow();
            expect(config.server.corsAllowedOrigins).toEqual(['example.com']);
            delete process.env.CORS_ALLOWED_ORIGINS;
        });

        it('should accept valid multiple domains', function () {
            process.env.CORS_ALLOWED_ORIGINS = 'example.com,api.example.com,sub.example.co.uk';
            expect(() => config.reloadConfig()).not.toThrow();
            expect(config.server.corsAllowedOrigins).toEqual([
                'example.com',
                'api.example.com',
                'sub.example.co.uk'
            ]);
            delete process.env.CORS_ALLOWED_ORIGINS;
        });

        it('should reject domains with protocol', function () {
            process.env.CORS_ALLOWED_ORIGINS = 'http://example.com';
            expect(() => config.reloadConfig()).toThrow(/Protocol is not allowed/);
            delete process.env.CORS_ALLOWED_ORIGINS;
        });

        it('should reject domains with underscores', function () {
            process.env.CORS_ALLOWED_ORIGINS = 'invalid_domain.com';
            expect(() => config.reloadConfig()).toThrow(/Underscore is not allowed/);
            delete process.env.CORS_ALLOWED_ORIGINS;
        });

        it('should reject domains without TLD', function () {
            process.env.CORS_ALLOWED_ORIGINS = 'localhost';
            expect(() => config.reloadConfig()).toThrow(/Missing top-level domain/);
            delete process.env.CORS_ALLOWED_ORIGINS;
        });

        it('should reject empty domains in list', function () {
            process.env.CORS_ALLOWED_ORIGINS = 'example.com,,other.com';
            expect(() => config.reloadConfig()).toThrow(/Empty domain is not allowed/);
            delete process.env.CORS_ALLOWED_ORIGINS;
        });

        it('should handle domains with multiple subdomains', function () {
            process.env.CORS_ALLOWED_ORIGINS = 'a.b.c.example.com';
            expect(() => config.reloadConfig()).not.toThrow();
            expect(config.server.corsAllowedOrigins).toEqual(['a.b.c.example.com']);
            delete process.env.CORS_ALLOWED_ORIGINS;
        });

        it('should reject domains with invalid characters', function () {
            process.env.CORS_ALLOWED_ORIGINS = 'example%.com';
            expect(() => config.reloadConfig()).toThrow(/Invalid domain format/);
            delete process.env.CORS_ALLOWED_ORIGINS;
        });

        it('should handle domains with hyphens correctly', function () {
            const validDomains = [
                'my-domain.com',
                'sub.my-domain.com',
                'my-domain-name.org'
            ].join(',');
            process.env.CORS_ALLOWED_ORIGINS = validDomains;
            expect(() => config.reloadConfig()).not.toThrow();
            expect(config.server.corsAllowedOrigins).toEqual(validDomains.split(','));
            delete process.env.CORS_ALLOWED_ORIGINS;
        });

        it('should reject domains with leading/trailing hyphens', function () {
            const invalidDomains = [
                '-example.com',
                'example-.com',
                'sub.-example.com'
            ];

            for (const domain of invalidDomains) {
                process.env.CORS_ALLOWED_ORIGINS = domain;
                expect(() => config.reloadConfig()).toThrow(/Invalid domain format/);
            }
            delete process.env.CORS_ALLOWED_ORIGINS;
        });
    });

    it('The static marking definitions should be created', function(done) {
        const options = {};
        markingDefinitionsService.retrieveAll(options, function(err, markingDefinitions) {
            if (err) {
                done(err);
            }
            else {
                // We expect to get two marking definitions
                expect(markingDefinitions).toBeDefined();
                expect(Array.isArray(markingDefinitions)).toBe(true);
                expect(markingDefinitions.length).toBe(2);

                done();
            }
        });
    });

    after(async function() {
        await database.closeConnection();
    });
});
