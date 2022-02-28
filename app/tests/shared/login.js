'use strict';

const request = require("supertest");
const setCookieParser = require("set-cookie-parser");

const passportCookieName = 'connect.sid';
exports.passportCookieName = passportCookieName;

exports.loginAnonymous = async function(app) {
    const res = await request(app)
        .get('/api/authn/anonymous/login')
        .set('Accept', 'application/json')
        .expect(200);

    // Save the cookie for later tests
    const cookies = setCookieParser(res);
    const passportCookie = cookies.find(c => c.name === passportCookieName);

    return passportCookie;
}
