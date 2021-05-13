'use strict';

const convict = require('convict');

const config = convict({
    server: {
        port: {
            doc: 'HTTP port for the server to listen on',
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
            default: 300,
            env: 'DEFAULT_INTERVAL'
        }
    },
    configurationFiles: {
        allowedValues: {
            default: './app/config/allowed-values.json',
            env: 'ALLOWED_VALUES_PATH'
        },
        jsonConfigFile: {
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
