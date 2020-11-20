'use strict';

module.exports = {
    server: {
        port: process.env.PORT || 3000
    },
    app: {
        name: 'federated-attack-rest-api',
        env: process.env.NODE_ENV || 'development'
    },
    database: {
        url: process.env.DATABASE_URL
    },
    openApi: {
        specPath: './app/api/definitions/openapi.yml'
    }
};
