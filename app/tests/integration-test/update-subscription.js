#!/usr/bin/env node

'use strict';

const superagent = require('superagent');
const setCookieParser = require('set-cookie-parser');

const passportCookieName = 'connect.sid';

let passportCookie;
async function login(url) {
    const res = await superagent.get(url);
    const cookies = setCookieParser(res);
    passportCookie = cookies.find(c => c.name === passportCookieName);
}

async function get(url) {
    const res = await superagent
        .get(url)
        .set('Cookie', `${ passportCookieName }=${ passportCookie.value }`);

     return res.body;
}

async function put(url, data) {
    return await superagent
        .put(url)
        .set('Cookie', `${ passportCookieName }=${ passportCookie.value }`)
        .send(data);
}

async function updateSubscription() {
    // Log into the Workbench REST API
    const loginUrl = 'http://localhost:3000/api/authn/anonymous/login';
    await login(loginUrl);

    // Get the collection index from the server
    const collectionIndexId = '43f56ef6-99a3-455d-9acc-88fce5e9dcd7';
    const getCollectionIndexesUrl = `http://localhost:3000/api/collection-indexes/${ collectionIndexId }`;
    const collectionIndex = await get(getCollectionIndexesUrl);

    // Add the subscription to the Green collection
    const collectionId = collectionIndex.collection_index.collections[2].id;
    collectionIndex.workspace.update_policy.subscriptions.push(collectionId);

    // Write the updated collection index to the server
    const putCollectionIndexesUrl = `http://localhost:3000/api/collection-indexes/${ collectionIndexId }`;
    await put(putCollectionIndexesUrl, collectionIndex);
}

updateSubscription()
    .then(() => {
        console.log('updateSubscription() - Terminating normally');
        process.exit();
    })
    .catch(err => {
        console.log('updateSubscription() - Error: ' + err);
        process.exit(1);
    });

