#!/bin/node

'use strict';

const keycloak = require('../app/tests/shared/keycloak');

const oidcHost = 'localhost:8080';
const oidcRealm = 'test-oidc-realm';
const oidcClientId = 'attack-workbench-test';
const oidcClientSecret = 'a58c55d9-8408-45de-a9ef-a55b433291de';

async function configureKeycloak() {
    await keycloak.initializeKeycloak(oidcHost, oidcRealm, oidcClientId, oidcClientSecret);
    console.log(`Keycloak configuration complete`);
}

configureKeycloak()
    .then(() => process.exit())
    .catch(err => {
        console.log('configureKeycloak() - Error: ' + err);
        process.exit(1);
    });
