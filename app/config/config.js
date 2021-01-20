'use strict';

module.exports = {
    server: {
        port: process.env.PORT || 3000
    },
    app: {
        name: 'attack-workbench-rest-api',
        env: process.env.NODE_ENV || 'development'
    },
    database: {
        url: process.env.DATABASE_URL
    },
    openApi: {
        specPath: './app/api/definitions/openapi.yml'
    },
    collectionIndex: {
        defaultInterval: process.env.DEFAULT_INTERVAL || 300
    }
};
