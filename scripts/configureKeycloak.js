#!/bin/node

/**
 * This script configures the keycloak server for testing with ATT&CK Workbench.
 *
 * The Keycloak server URL is currently hardcoded in this script at localhost:8080.
 * The URL for the ATT&CK Database is also hardcoded (mongodb://localhost/attack-workspace).
 *
 * Configuring the keycloak server includes:
 *   - Adding a realm (test-oidc-realm)
 *   - Adding a client (attack-workbench-rest-api)
 *   - Adding users to keycloak (admin@test.com, editor@test.com, visitor@test.com)
 *   - Adding the same users as user accounts on ATT&CK Workbench
 *
 * Usage:
 *   node ./scripts/configureKeycloak.js
 *
 */

'use strict';

const keycloak = require('../app/tests/shared/keycloak');
const userAccountService = require('../app/services/user-accounts-service');

const oidcHost = 'localhost:8080';
const oidcRealm = 'test-oidc-realm';
const oidcClientId = 'attack-workbench-rest-api';
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
    standardFlowEnabled: true,
    redirectUris: [oidcClientRedirectUrl],
    clientSecret: oidcClientSecret,
  };
  await keycloak.initializeKeycloak(options);

  // Add the initial user accounts to Keycloak
  const adminUser = {
    email: 'admin@test.com',
    username: 'admin@test.com',
    password: 'testuser',
    firstName: 'Admin',
    lastName: 'User',
  };
  const teamLeadUser = {
    email: 'teamlead@test.com',
    username: 'teamlead@test.com',
    password: 'testuser',
    firstName: 'Team Lead',
    lastName: 'User',
  };
  const editorUser = {
    email: 'editor@test.com',
    username: 'editor@test.com',
    password: 'testuser',
    firstName: 'Editor',
    lastName: 'User',
  };
  const visitorUser = {
    email: 'visitor@test.com',
    username: 'visitor@test.com',
    password: 'testuser',
    firstName: 'Visitor',
    lastName: 'User',
  };
  const keycloakUsers = [adminUser, editorUser, visitorUser, teamLeadUser];
  await keycloak.addUsersToKeycloak(options, keycloakUsers);

  // Establish the database connection
  console.log('Setting up the database connection');
  await require('../app/lib/database-connection').initializeConnection({ databaseUrl });

  // Add the initial user accounts to the REST API
  const adminWBUser = {
    email: adminUser.email,
    username: adminUser.username,
    displayName: `${adminUser.firstName} ${adminUser.lastName}`,
    status: 'active',
    role: 'admin',
  };
  const teamLeadWBUser = {
    email: teamLeadUser.email,
    username: admiteamLeadUsernUser.username,
    displayName: `${teamLeadUser.firstName} ${teamLeadUser.lastName}`,
    status: 'active',
    role: 'team lead',
  };
  const editorWBUser = {
    email: editorUser.email,
    username: editorUser.username,
    displayName: `${editorUser.firstName} ${editorUser.lastName}`,
    status: 'active',
    role: 'editor',
  };
  const visitorWBUser = {
    email: visitorUser.email,
    username: visitorUser.username,
    displayName: `${visitorUser.firstName} ${visitorUser.lastName}`,
    status: 'active',
    role: 'visitor',
  };
  const workbenchUsers = [adminWBUser, editorWBUser, visitorWBUser, teamLeadWBUser];
  for (const user of workbenchUsers) {
    try {
      await userAccountService.create(user);
      console.log(`Added user ${user.email} to the Workbench database`);
    } catch (err) {
      console.error(`Unable to add user ${user.email} to the Workbench database: ${err}`);
    }
  }

  console.log(`Keycloak configuration complete`);
}

configureKeycloak()
  .then(() => process.exit())
  .catch((err) => {
    console.log('configureKeycloak() - Error: ' + err);
    process.exit(1);
  });
