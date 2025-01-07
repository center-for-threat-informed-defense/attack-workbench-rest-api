'use strict';

const passport = require('passport');
const { BasicStrategy } = require('passport-http');

const config = require('../config/config');

let strategyName;
exports.strategyName = function () {
  return strategyName;
};

/**
 * This strategy is intended to support service authentication using the Basic strategy. The service must
 * include the service name and apikey in the Authorization header with each request:
 *
 *     Authorization: Basic <base-64 encoded serviceName:apikey>
 */

/**
 * This function takes the user session object and returns the value (the userSessionKey) that will be
 * stored in the express session for this user
 */
exports.serializeUser = function (userSession, done) {
  if (userSession.strategy === 'basic') {
    // This indicates that the client has been authenticated using the Basic strategy. This will be used when
    // deserializing.
    const userSessionKey = { strategy: 'basic' };
    done(null, userSessionKey);
  } else {
    // Try the next serializer
    done('pass');
  }
};

/**
 * This function takes the userSessionKey (the value stored in the express session for this user) and
 * returns the user session object.
 *
 * This implementations returns a null value if the strategy is 'basic'. This causes req.user to be set to null.
 * Since other strategies depend on req.user being set to indicate that the user is authenticated, this prevents
 * those strategies from incorrectly believing the user is authenticated.
 *
 * Note that req.user will be set to the correct value after the strategy calls verifyCallback() and the Basic token
 * is verified.
 */
exports.deserializeUser = function (userSessionKey, done) {
  if (userSessionKey.strategy === 'basic') {
    done(null, null);
  } else {
    // Try the next deserializer
    done('pass');
  }
};

let authenticateWithBasicToken;
exports.getStrategy = function () {
  const strategy = new BasicStrategy(verifyCallback);
  strategyName = strategy.name;

  // Get a passport authenticate middleware function for this strategy
  authenticateWithBasicToken = passport.authenticate(strategy.name);

  return strategy;
};

function verifyApikey(serviceName, apikey, done) {
  // Do not attempt to verify the apikey unless basic apikey authentication is enabled
  if (!config.serviceAuthn.basicApikey.enable) {
    return done(null, false, { message: 'Authentication mechanism not found' });
  }

  // Verify that the service is on the list of configured services and the apikey is correct
  const services = config.serviceAuthn.basicApikey.serviceAccounts;
  const service = services.find((s) => s.name === serviceName);
  if (!service) {
    return done(null, false, { message: 'Service not found' });
  } else if (service.apikey !== apikey) {
    return done(null, false, { message: 'Invalid apikey' });
  }

  const userSession = makeUserSession(null, serviceName);

  return done(null, userSession);
}

/**
 * This function is called by the strategy when the user is authenticating using the basic strategy.
 * It verifies that the userid (service name) and password (apikey) is valid, then creates and returns the user session for this user.
 */
function verifyCallback(serviceName, apikey, done) {
  if (!serviceName) {
    return done(null, false, { message: 'Missing service name' });
  }
  if (!apikey) {
    return done(null, false, { message: 'Missing apikey' });
  }

  return verifyApikey(serviceName, apikey, done);
}

function makeUserSession(clientId, serviceName) {
  const userSession = {
    strategy: 'basic',
    clientId,
    serviceName,
    service: true,
  };

  return userSession;
}

/**
 * The basic strategy requires the Basic apikey to be validated for every request. This middleware function
 * calls the authenticate() function for the Basic strategy (which cause the apikey to be validated).
 *
 */
exports.authenticate = function (req, res, next) {
  if (authenticateWithBasicToken) {
    authenticateWithBasicToken(req, res, next);
  } else {
    throw new Error('Basic strategy not configured');
  }
};
