'use strict';

const convict = require('convict');
const crypto = require('crypto');

// Generate the default session secret
// This runs synchronously, but only once at startup
// Using the default session secret will limit the session cookies to one run of the server
//   - Restarting the server will force the users to login again
//   - Sessions cannot be shared across server instances
// Setting the SESSION_SECRET environment variable will override this generated value
const stringBase = 'base64';
const byteLength = 48;
const buffer = crypto.randomBytes(byteLength);
const defaultSessionSecret = buffer.toString(stringBase);

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
    },
    session: {
        secret: {
            doc: 'Secret used to sign the session ID cookie',
            default: defaultSessionSecret,
            env: 'SESSION_SECRET'
        }
    },
    authn: {
        mechanism: {
            doc: 'Authentication mechanism to use',
            format: ['oidc', 'anonymous'],
            default: 'anonymous',
            env: 'AUTHN_MECHANISM'
        },
        oidc: {
            issuerUrl: {
                doc: 'OIDC Issuer URL',
                format: String,
                default: '',
                env: 'AUTHN_OIDC_ISSUER_URL'
            },
            clientId: {
                doc: 'OIDC Client ID',
                format: String,
                default: '',
                env: 'AUTHN_OIDC_CLIENT_ID'
            },
            clientSecret: {
                doc: 'OIDC Client Secret',
                format: String,
                default: '',
                env: 'AUTHN_OIDC_CLIENT_SECRET'
            }
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
