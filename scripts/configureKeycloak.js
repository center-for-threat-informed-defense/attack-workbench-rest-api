#!/bin/node

'use strict';

const keycloak = require('../app/tests/shared/keycloak');
const userAccountService = require('../app/services/user-accounts-service');

const oidcHost = 'localhost:8080';
const oidcRealm = 'test-oidc-realm';
const oidcClientId = 'attack-workbench-test';
const oidcClientSecret = 'a58c55d9-8408-45de-a9ef-a55b433291de';
const oidcClientRedirectUrl = 'http://localhost:3000/api/authn/oidc/*';

const databaseUrl = process.env.DATABASE_URL || 'mongodb://localhost/attack-workspace';

async function configureKeycloak() {
    // Initialize the Keycloak server
    const options = {
        basePath: oidcHost,
        realmName: oidcRealm,
        clientId: oidcClientId,
        description: 'client',
        redirectUris: [ oidcClientRedirectUrl ],
        clientSecret: oidcClientSecret
    };
    await keycloak.initializeKeycloak(options);

    // Add the initial user accounts to Keycloak
    const adminUser = { email: 'admin@test.com', username: 'Admin User', password: 'testuser' };
    const editorUser = { email: 'editor@test.com', username: 'Editor User', password: 'testuser' };
    const visitorUser = { email: 'visitor@test.com', username: 'Visitor User', password: 'testuser' };
    const keycloakUsers = [ adminUser, editorUser, visitorUser ];
    await keycloak.addUsersToKeycloak(options, keycloakUsers);

    // Establish the database connection
    console.log('Setting up the database connection');
    await require('../app/lib/database-connection').initializeConnection({ databaseUrl });

    // Add the initial user accounts to the REST API
    const adminWBUser = { email: adminUser.email, username: adminUser.username, status: 'active', role: 'admin' };
    const editorWBUser = { email: editorUser.email, username: editorUser.username, status: 'active', role: 'editor' };
    const visitorWBUser = { email: visitorUser.email, username: visitorUser.username, status: 'active', role: 'visitor' };
    const workbenchUsers = [ adminWBUser, editorWBUser, visitorWBUser ];
    for (const user of workbenchUsers) {
        try {
            // eslint-disable-next-line no-await-in-loop
            await userAccountService.create(user);
            console.log(`Added user ${ user.email } to the Workbench database`);
        }
        catch(err) {
            console.error(`Unable to add user ${ user.email } to the Workbench database: ${ err }`);
        }
    }

    console.log(`Keycloak configuration complete`);
}

configureKeycloak()
    .then(() => process.exit())
    .catch(err => {
        console.log('configureKeycloak() - Error: ' + err);
        process.exit(1);
    });
