'use strict';

const request = require('superagent');
const logger = require('../../lib/logger');

const adminClientId = 'admin-cli';
const defaultAdminUsername = 'admin';
const defaultAdminPassword = 'admin';

async function deleteRealm(basePath, realmName, token) {
  // Delete the realm if it exists
  try {
    await request
      .delete(`${basePath}/admin/realms/${realmName}`)
      .set('Authorization', `bearer ${token}`);
    console.info(`Deleted existing realm ${realmName}`);
  } catch (err) {
    if (err.status === 404) {
      // Realm not found is ok
    } else {
      logger.error('Unable to delete realm');
      throw err;
    }
  }
}

async function createRealm(basePath, realmName, token) {
  const realmData = {
    realm: realmName,
    enabled: true,
  };

  try {
    await request
      .post(`${basePath}/admin/realms`)
      .set('Authorization', `bearer ${token}`)
      .send(realmData);
    console.info(`Created realm ${realmName}`);
  } catch (err) {
    logger.error(`Unable to create realm ${realmName}`);
    throw err;
  }
}

async function createClient(options, token) {
  const clientData = {
    clientId: options.clientId,
    name: options.clientId,
    description: options.description,
    enabled: true,
    redirectUris: options.redirectUris,
    standardFlowEnabled: options.standardFlowEnabled,
    serviceAccountsEnabled: options.serviceAccountsEnabled,
  };
  if (options.clientSecret) {
    clientData.secret = options.clientSecret;
  }

  try {
    await request
      .post(`${options.basePath}/admin/realms/${options.realmName}/clients`)
      .set('Authorization', `bearer ${token}`)
      .send(clientData);
    console.info(`Created client ${options.clientId}`);
  } catch (err) {
    logger.error('Unable to create client');
    throw err;
  }
}

async function getClient(options, token) {
  try {
    const res = await request
      .get(
        `${options.basePath}/admin/realms/${options.realmName}/clients?clientId=${options.clientId}`,
      )
      .set('Authorization', `bearer ${token}`);

    if (res.body.length === 1) {
      return res.body[0];
    } else {
      return null;
    }
  } catch (err) {
    logger.error('Unable to get client');
    throw err;
  }
}

async function createClientSecret(basePath, realmName, idOfClient, token) {
  try {
    const res = await request
      .post(`${basePath}/admin/realms/${realmName}/clients/${idOfClient}/client-secret`)
      .set('Authorization', `bearer ${token}`);

    return res.body;
  } catch (err) {
    logger.error('Unable to create client secret');
    throw err;
  }
}

async function getClientSecret(basePath, realmName, idOfClient, token) {
  try {
    const res = await request
      .get(`${basePath}/admin/realms/${realmName}/clients/${idOfClient}/client-secret`)
      .set('Authorization', `bearer ${token}`);

    return res.body;
  } catch (err) {
    logger.error('Unable to create client secret');
    throw err;
  }
}

// async function getWellKnownConfiguration(basePath, realmName, token) {
//     try {
//         const res = await request
//             .get(`${ basePath }/realms/${ realmName }/.well-known/openid-configuration`)
//             .set('Authorization', `bearer ${ token }`);
//         console.log(res);
//     }
//     catch (err) {
//         logger.error('Unable to get well known configuration');
//         throw err;
//     }
// }

async function createUser(basePath, realmName, userOptions, token) {
  const userData = {
    email: userOptions.email,
    username: userOptions.username,
    firstName: userOptions.firstName,
    lastName: userOptions.lastName,
    enabled: true,
    credentials: [
      {
        type: 'password',
        value: userOptions.password,
        temporary: false,
      },
    ],
  };

  try {
    await request
      .post(`${basePath}/admin/realms/${realmName}/users`)
      .set('Authorization', `bearer ${token}`)
      .send(userData);
    console.info(
      `Added user '${userOptions.username}' to the realm '${realmName}' on the Keycloak server`,
    );
  } catch (err) {
    logger.error('Unable to create user');
    throw err;
  }
}

async function getAuthorizationToken(basePath) {
  console.info(`Requesting authorization token from ${basePath}`);
  const res = await request
    .post(`${basePath}/realms/master/protocol/openid-connect/token`)
    .send(`client_id=${adminClientId}`)
    .send(`username=${defaultAdminUsername}`)
    .send(`password=${defaultAdminPassword}`)
    .send(`grant_type=password`);

  const adminAccessToken = res.body.access_token;
  return adminAccessToken;
}

exports.initializeKeycloak = async function (options) {
  const adminAccessToken = await getAuthorizationToken(options.basePath);

  // Configure the server
  await deleteRealm(options.basePath, options.realmName, adminAccessToken);
  await createRealm(options.basePath, options.realmName, adminAccessToken);
  await createClient(options, adminAccessToken);
  const client = await getClient(options, adminAccessToken);
  if (!options.clientSecret) {
    console.info(`clientSecret not provided, creating new clientSecret`);
    await createClientSecret(options.basePath, options.realmName, client.id, adminAccessToken);
  }

  const clientCredentials = await getClientSecret(
    options.basePath,
    options.realmName,
    client.id,
    adminAccessToken,
  );
  return clientCredentials;
};

exports.addUsersToKeycloak = async function (serverOptions, users) {
  const adminAccessToken = await getAuthorizationToken(serverOptions.basePath);

  if (!Array.isArray(users)) {
    users = [users];
  }

  for (const user of users) {
    await createUser(serverOptions.basePath, serverOptions.realmName, user, adminAccessToken);
  }

  // await getWellKnownConfiguration(serverOptions.basePath, serverOptions.realmName, adminAccessToken);
};

exports.addClientToKeycloak = async function (clientOptions) {
  const adminAccessToken = await getAuthorizationToken(clientOptions.basePath);

  // Configure the server
  await createClient(clientOptions, adminAccessToken);
  const client = await getClient(clientOptions, adminAccessToken);
  if (!clientOptions.clientSecret) {
    console.info(`clientSecret not provided, creating new clientSecret`);
    await createClientSecret(
      clientOptions.basePath,
      clientOptions.realmName,
      client.id,
      adminAccessToken,
    );
  }
};

exports.getAccessTokenToClient = async function (clientOptions) {
  console.info(
    `Requesting client access token for ${clientOptions.clientId} from ${clientOptions.basePath}`,
  );
  const res = await request
    .post(
      `${clientOptions.basePath}/realms/${clientOptions.realmName}/protocol/openid-connect/token`,
    )
    .send(`client_id=${clientOptions.clientId}`)
    .send(`client_secret=${clientOptions.clientSecret}`)
    .send(`grant_type=client_credentials`);

  const clientAccessToken = res.body.access_token;
  return clientAccessToken;
};
