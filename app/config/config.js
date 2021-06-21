'use strict';

const convict = require('convict');

const config = convict({
    server: {
        port: {
            doc: 'Port the HTTP server should listen on',
            format: 'int',
            default: 3000,
            env: 'PORT'
        },
        enableCorsAnyOrigin: {
            doc: 'Access-Control-Allow-Origin will be set to the wildcard (*), allowing requests from any domain to access the REST API endpoints',
            format: Boolean,
            default: true,
            env: 'ENABLE_CORS_ANY_ORIGIN'
        }
    },
    app: {
        name: {
            default: 'attack-workbench-rest-api'
        },
        env: {
            default: 'development',
            env: 'NODE_ENV'
        }
    },
    database: {
        url: {
            doc: 'URL of the MongoDB server',
            default: '',
            env: 'DATABASE_URL'
        }
    },
    openApi: {
        specPath: {
            default: './app/api/definitions/openapi.yml'
        }
    },
    collectionIndex: {
        defaultInterval: {
            doc: 'How often collection indexes should check for updates (in seconds). Only applies to new indexes added to the REST API, does not affect existing collection indexes',
            default: 300,
            env: 'DEFAULT_INTERVAL'
        }
    },
    configurationFiles: {
        allowedValues: {
            doc: 'Location of the allowed values configuration file',
            default: './app/config/allowed-values.json',
            env: 'ALLOWED_VALUES_PATH'
        },
        jsonConfigFile: {
            doc: 'Location of a JSON file containing configuration values',
            default: '',
            env: 'JSON_CONFIG_PATH'
        }
    }
});

// Load configuration values from a JSON file if the JSON_CONFIG_PATH environment variable is set
if (config.get('configurationFiles.jsonConfigFile')) {
    config.loadFile(config.get('configurationFiles.jsonConfigFile'));
}

config.validate({ allowed: 'strict' });

// Extract the configuration as an object to simplify access
module.exports = config.getProperties();
