'use strict';

const convict = require('convict');
const crypto = require('crypto');
const packageJson = require('../../package.json');

// Generate the default session secret
// This runs synchronously, but only once at startup
// Using the default session secret will limit the session cookies to one run of the server
//   - Restarting the server will force the users to login again
//   - Sessions cannot be shared across server instances
// Setting the SESSION_SECRET environment variable will override this generated value
function generateSecret() {
    const stringBase = 'base64';
    const byteLength = 48;
    const buffer = crypto.randomBytes(byteLength);
    const secret = buffer.toString(stringBase);

    return secret;
}

const defaultSessionSecret = generateSecret();
const defaultTokenSigningSecret = generateSecret();

const userAuthnMechanismValues = ['anonymous', 'oidc'];
convict.addFormat(enumFormat('user-authn-mechanism', userAuthnMechanismValues, true));

const serviceRoleValues = ['read-only', 'collection-manager'];
convict.addFormat(enumFormat('service-role', serviceRoleValues, true));

// Creates a new convict format for a list of enumerated values
function enumFormat(name, values, coerceLower) {
    return {
        name,
        validate: function (val) {
            if (!values.includes(val)) {
                throw new Error(`Invalid ${ name } value`);
            }
        },
        coerce: function (val) {
            if (coerceLower) {
                return val.toLowerCase();
            }
            else {
                return val;
            }
        }
    }
}

function arrayFormat(name) {
    return {
        name,
        validate: function(entries, schema) {
            if (!Array.isArray(entries)) {
                throw new Error('Property must be of type Array');
            }

            for (const entry of entries) {
                convict(schema.children).load(entry).validate();
            }
        }
    }
}
convict.addFormat(arrayFormat('oidc-client'));
convict.addFormat(arrayFormat('service-account'));

function loadConfig() {
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
            },
            version: {
                default: packageJson.version
            },
            attackSpecVersion: {
                default: packageJson.attackSpecVersion
            }
        },
        database: {
            url: {
                doc: 'URL of the MongoDB server',
                default: '',
                env: 'DATABASE_URL'
            }
        },
        logging: {
            logLevel: {
                doc: 'Level of logging messages to write to console (error, warn, http, info, verbose, debug)',
                default: 'info',
                env: 'LOG_LEVEL'
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
        userAuthn: {
            mechanism: {
                doc: 'Authentication mechanism to use for user log in',
                format: 'user-authn-mechanism',
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
        },
        serviceAuthn: {
            oidcClientCredentials: {
                enable: {
                    doc: 'Enable OIDC Client Credentials Flow for service accounts',
                    format: Boolean,
                    default: false,
                    env: 'SERVICE_ACCOUNT_OIDC_ENABLE'
                },
                jwksUri: {
                    doc: 'JWKS URI for obtaining the public key from the OIDC identity provider',
                    format: String,
                    default: '',
                    env: 'JWKS_URI'
                },
                clients: {
                    doc: 'Services (OIDC clients) that may access the REST API',
                    format: 'oidc-client',
                    default: [],
                    children: {
                        clientId: {
                            doc: 'clientId for the service',
                            format: String,
                            default: null
                        },
                        serviceRole: {
                            doc: 'The role determines which endpoints the service is permitted to access',
                            format: 'service-role',
                            default: 'read-only'
                        }
                    }
                }
            },
            apikey: {
                enable: {
                    doc: 'Enable apikey authentication for service accounts',
                    format: Boolean,
                    default: true,
                    env: 'SERVICE_ACCOUNT_APIKEY_ENABLE'
                },
                secret: {
                    doc: 'Secret used to sign the tokens issued to service accounts',
                    default: defaultTokenSigningSecret,
                    env: 'TOKEN_SIGNING_SECRET'
                },
                tokenTimeout: {
                    doc: 'Timeout of the token',
                    format: 'int',
                    default: 300,
                    env: 'TOKEN_TIMEOUT'
                },
                serviceAccounts: {
                    doc: 'Services accounts that may access the REST API',
                    format: 'service-account',
                    default: [],
                    children: {
                        name: {
                            doc: 'Name of the service account',
                            format: String,
                            default: null
                        },
                        apikey: {
                            doc: 'apikey of the service account (shared secret)',
                            format: String,
                            default: null
                        },
                        serviceRole: {
                            doc: 'The role determines which endpoints the service is permitted to access',
                            format: 'service-role',
                            default: 'read-only'
                        }
                    }
                }
            }
        }
    });

    // Load configuration values from a JSON file if the JSON_CONFIG_PATH environment variable is set
    if (config.get('configurationFiles.jsonConfigFile')) {
        config.loadFile(config.get('configurationFiles.jsonConfigFile'));
    }

    config.validate({ allowed: 'strict' });

    return config.getProperties();
}

// Load the configuration and extract the configuration properties to simplify access
const configurationObject = loadConfig();

// Add a function to reload the configuration properties
configurationObject.reloadConfig = function() {
    const newConfigProperties = loadConfig();
    Object.assign(configurationObject, newConfigProperties);
};

module.exports = configurationObject;
