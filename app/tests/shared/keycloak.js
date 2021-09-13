'use strict';

const request = require('superagent');
const logger = require('../../lib/logger');

async function deleteRealm(basePath, realmName, token) {
    // Delete the realm if it exists
    try {
        await request
            .delete(`${basePath}/auth/admin/realms/${realmName}`)
            .set('Authorization', `bearer ${token}`);
    }
    catch(err) {
        if (err.status === 404) {
            // Realm not found is ok
        }
        else {
            logger.error('Unable to delete realm');
            throw err;
        }
    }
}

async function createRealm(basePath, realmName, token) {
    const realmData = {
        realm: realmName,
        enabled: true
    };

    try {
        await request
            .post(`${basePath}/auth/admin/realms`)
            .set('Authorization', `bearer ${token}`)
            .send(realmData);
    }
    catch (err) {
        logger.error('Unable to create realm');
        throw err;
    }
}

async function createClient(basePath, realmName, clientId, clientSecret, token) {
    const clientData = {
        clientId: clientId,
        name: clientId,
        description: 'client',
        enabled: true,
        redirectUris: ['http://localhost:3000/api/authn/oidc/*']
    };
    if (clientSecret) {
        clientData.secret = clientSecret;
    }

    try {
        await request
            .post(`${basePath}/auth/admin/realms/${ realmName }/clients`)
            .set('Authorization', `bearer ${token}`)
            .send(clientData);
    }
    catch (err) {
        logger.error('Unable to create client');
        throw err;
    }
}

async function getClient(basePath, realmName, clientId, token) {
    try {
        const res = await request
            .get(`${basePath}/auth/admin/realms/${ realmName }/clients?clientId=${ clientId }`)
            .set('Authorization', `bearer ${token}`);

        if (res.body.length === 1) {
            return res.body[0];
        }
        else {
            return null;
        }
    }
    catch (err) {
        logger.error('Unable to get client');
        throw err;
    }
}

async function createClientSecret(basePath, realmName, idOfClient, token) {
    try {
        const res = await request
            .post(`${basePath}/auth/admin/realms/${ realmName }/clients/${ idOfClient }/client-secret`)
            .set('Authorization', `bearer ${token}`);

        return res.body;
    }
    catch (err) {
        logger.error('Unable to create client secret');
        throw err;
    }
}

async function getClientSecret(basePath, realmName, idOfClient, token) {
    try {
        const res = await request
            .get(`${basePath}/auth/admin/realms/${ realmName }/clients/${ idOfClient }/client-secret`)
            .set('Authorization', `bearer ${token}`);

        return res.body;
    }
    catch (err) {
        logger.error('Unable to create client secret');
        throw err;
    }
}

async function createUser(basePath, realmName, token) {
    const userData = {
        email: 'test@test.com',
        username: 'testuser',
        enabled: true,
        credentials: [
            {
                type: 'password',
                value: 'testuser',
                temporary: false
            }
        ]
    };

    try {
        await request
            .post(`${basePath}/auth/admin/realms/${ realmName }/users`)
            .set('Authorization', `bearer ${token}`)
            .send(userData);
    }
    catch (err) {
        logger.error('Unable to create user');
        throw err;
    }
}

exports.initializeKeycloak = async function (basePath, realmName, clientId, clientSecret) {
    // Get the authorization token
    const res = await request
        .post(`${ basePath }/auth/realms/master/protocol/openid-connect/token`)
        .send('client_id=admin-cli')
        .send('username=admin')
        .send('password=admin')
        .send('grant_type=password');

    const adminAccessToken = res.body.access_token;

    await deleteRealm(basePath, realmName, adminAccessToken);
    await createRealm(basePath, realmName, adminAccessToken);
    await createClient(basePath, realmName, clientId, clientSecret, adminAccessToken);
    const client = await getClient(basePath, realmName, clientId, adminAccessToken);
    if (!clientSecret) {
        await createClientSecret(basePath, realmName, client.id, adminAccessToken);
    }
    const clientCredentials = await getClientSecret(basePath, realmName, client.id, adminAccessToken);
    await createUser(basePath, realmName, adminAccessToken);

    return clientCredentials;
};
