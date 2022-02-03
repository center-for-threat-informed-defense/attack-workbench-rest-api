'use strict';

const userAccountsService = require('../services/user-accounts-service');
const logger = require('../lib/logger');
const config = require('../config/config');

exports.retrieveAll = function(req, res) {
    const options = {
        offset: req.query.offset || 0,
        limit: req.query.limit || 0,
        status: req.query.status,
        role: req.query.role,
        search: req.query.search,
        includePagination: req.query.includePagination
    }

    userAccountsService.retrieveAll(options, function(err, results) {
        if (err) {
            logger.error('Failed with error: ' + err);
            return res.status(500).send('Unable to get user accounts. Server error.');
        }
        else {
            if (options.includePagination) {
                logger.debug(`Success: Retrieved ${ results.data.length } of ${ results.pagination.total } total user account(s)`);
            }
            else {
                logger.debug(`Success: Retrieved ${ results.length } user account(s)`);
            }
            return res.status(200).send(results);
        }
    });
};

exports.retrieveById = function(req, res) {
    userAccountsService.retrieveById(req.params.id, function (err, userAccount) {
        if (err) {
            if (err.message === userAccountsService.errors.badlyFormattedParameter) {
                logger.warn('Badly formatted user account id: ' + req.params.id);
                return res.status(400).send('User account id is badly formatted.');
            }
            else {
                logger.error('Failed with error: ' + err);
                return res.status(500).send('Unable to get user account. Server error.');
            }
        }
        else {
            if (!userAccount) {
                return res.status(404).send('User account not found.');
            }
            else {
                logger.debug(`Success: Retrieved user account with id ${ req.params.id }`);
                return res.status(200).send(userAccount);
            }
        }
    });
};

exports.create = async function(req, res) {
    // Get the data from the request
    const userAccountData = req.body;

    if (userAccountData.status !== 'active' && userAccountData.role ) {
        logger.warn('Unable to create user account, role not allowed when status is not active');
        return res.status(400).send('role not allowed when status is not active');
    }

    // Create the user account
    try {
        const userAccount = await userAccountsService.create(userAccountData);

        logger.debug(`Success: Created user account with id ${ userAccount.id }`);
        return res.status(201).send(userAccount);
    }
    catch(err) {
        if (err.message === userAccountsService.errors.duplicateEmail) {
            logger.warn(`Unable to create user account, duplicate email: ${ userAccountData.email }`);
            return res.status(400).send('Duplicate email');
        }
        else {
            logger.error("Failed with error: " + err);
            return res.status(500).send('Unable to create user account. Server error.');
        }
    }
};

exports.updateFull = function(req, res) {
    // Get the data from the request
    const userAccount = req.body;

    // Create the technique
    userAccountsService.updateFull(req.params.id, userAccount, function(err, userAccount) {
        if (err) {
            logger.error("Failed with error: " + err);
            return res.status(500).send("Unable to update user account. Server error.");
        }
        else {
            if (!userAccount) {
                return res.status(404).send('User account not found.');
            } else {
                logger.debug("Success: Updated user account with id " + userAccount.id);
                return res.status(200).send(userAccount);
            }
        }
    });
};

exports.delete = function(req, res) {
    userAccountsService.delete(req.params.id, function (err, userAccount) {
        if (err) {
            logger.error('Delete user account failed. ' + err);
            return res.status(500).send('Unable to delete user account. Server error.');
        }
        else {
            if (!userAccount) {
                return res.status(404).send('User account not found.');
            } else {
                logger.debug("Success: Deleted user account with id " + userAccount.id);
                return res.status(204).end();
            }
        }
    });
};

exports.register = async function(req, res) {
    if (config.userAuthn.mechanism === 'anonymous') {
        logger.warn('Unable to register user account, app configured to use anonymous authentication');
        return res.status(400).send('Cannot register user accounts when anonymous authentication is enabled');
    }
    else if (!req.user) {
        logger.warn('Unable to register user account, not logged in');
        return res.status(400).send('Must login before registering');
    }
    else if (req.user.registered) {
        logger.warn('Unable to register user account, already registered');
        return res.status(400).send('Already registered');
    }

    const userAccountData = {
        email: req.user.email,
        username: req.user.name,
        status: 'pending',
        role: 'none'
    }

    // Register (create) the user account
    try {
        const userAccount = await userAccountsService.create(userAccountData);

        logger.debug(`Success: Registed user account with id ${ userAccount.id }`);
        return res.status(201).send(userAccount);
    }
    catch(err) {
        if (err.message === userAccountsService.errors.duplicateEmail) {
            logger.warn(`Unable to register user account, duplicate email: ${ userAccountData.email }`);
            return res.status(400).send('Duplicate email');
        }
        else {
            logger.error("Failed with error: " + err);
            return res.status(500).send('Unable to register user account. Server error.');
        }
    }
};
