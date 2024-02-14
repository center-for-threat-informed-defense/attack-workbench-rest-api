'use strict';

const userAccountsService = require('../services/user-accounts-service');
const logger = require('../lib/logger');
const config = require('../config/config');
const { BadlyFormattedParameterError } = require('../exceptions');

exports.retrieveAll = async function (req, res) {
    const options = {
        offset: req.query.offset || 0,
        limit: req.query.limit || 0,
        status: req.query.status,
        role: req.query.role,
        search: req.query.search,
        includePagination: req.query.includePagination,
        includeStixIdentity: req.query.includeStixIdentity
    };

    try {

        const results = await userAccountsService.retrieveAll(options);

        if (options.includePagination) {
            logger.debug(`Success: Retrieved ${results.data.length} of ${results.pagination.total} total user account(s)`);
        }
        else {
            logger.debug(`Success: Retrieved ${results.length} user account(s)`);
        }
        return res.status(200).send(results);
    } catch (err) {
        console.log("retrieveall");
        console.log(err);
        logger.error('Failed with error: ' + err);
        return res.status(500).send('Unable to get user accounts. Server error.');
    }
};

exports.retrieveById = async function (req, res) {
    const options = {
        includeStixIdentity: req.query.includeStixIdentity
    };

    try {
        const userAccount = await userAccountsService.retrieveById(req.params.id, options);
        if (!userAccount) {
            return res.status(404).send('User account not found.');
        }
        else {
            logger.debug(`Success: Retrieved user account with id ${req.params.id}`);
            return res.status(200).send(userAccount);
        }
    } catch (err) {
        if (err instanceof BadlyFormattedParameterError) {
            logger.warn('Badly formatted user account id: ' + req.params.id);
            return res.status(400).send('User account id is badly formatted.');
        }
        else {
            logger.error('Failed with error: ' + err);
            return res.status(500).send('Unable to get user account. Server error.');
        }
    }
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
            console.log("create");
            console.log(err);
            logger.error("Failed with error: " + err);
            return res.status(500).send('Unable to create user account. Server error.');
        }
    }
};

exports.updateFullAsync = async function (req, res) {
    try {
        // Create the technique
        const userAccount = await userAccountsService.updateFull(req.params.id, req.body);
        if (!userAccount) {
            return res.status(404).send('User account not found.');
        } else {
            logger.debug("Success: Updated user account with id " + userAccount.id);
            return res.status(200).send(userAccount);
        }
    } catch (err) {
        console.log("updatefullasync");
        console.log(err);
        logger.error("Failed with error: " + err);
        return res.status(500).send("Unable to update user account. Server error.");
    }
};

exports.updateFull = async function (req, res) {
    // Create the technique
    try {
        const userAccount = await userAccountsService.updateFull(req.params.id, req.body);
        if (!userAccount) {
            return res.status(404).send('User account not found.');
        } else {
            logger.debug("Success: Updated user account with id " + userAccount.id);
            return res.status(200).send(userAccount);
        }
    } catch (err) {
        logger.error("Failed with error: " + err);
        return res.status(500).send("Unable to update user account. Server error.");
    }
};

exports.deleteAsync = async function (req, res) {
    try {
        const userAccount = await userAccountsService.delete(req.params.id);
        if (!userAccount) {
            return res.status(404).send('User account not found.');
        } else {
            logger.debug("Success: Deleted user account with id " + userAccount.id);
            return res.status(204).end();
        }
    } catch (err) {
        console.log("deleteasync");
        console.log(err);
        logger.error('Delete user account failed. ' + err);
        return res.status(500).send('Unable to delete user account. Server error.');
    }
};

exports.delete = async function (req, res) {

    try {
        const userAccount = await userAccountsService.delete(req.params.id);
        if (!userAccount) {
            return res.status(404).send('User account not found.');
        } else {
            logger.debug("Success: Deleted user account with id " + userAccount.id);
            return res.status(204).end();
        }
    } catch (err) {
        console.log("delete");
        console.log(err);
        logger.error('Delete user account failed. ' + err);
        return res.status(500).send('Unable to delete user account. Server error.');
    }
};

exports.register = async function(req, res) {
    // The function supports self-registration of a logged in user

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
    else if (req.user.service) {
        logger.warn('Unable to register service account');
        return res.status(400).send('Cannot register service account');
    }

    const userAccountData = {
        email: req.user.email,
        username: req.user.name,
        displayName: req.user.displayName,
        status: 'pending'
    }

    // Register (create) the user account
    try {
        const userAccount = await userAccountsService.create(userAccountData);

        logger.debug(`Success: Registed user account with id ${ userAccount.id }`);
        return res.status(201).send(userAccount);
    }
    catch(err) {
        console.log("register");
        console.log(err);
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

exports.retrieveTeamsByUserId = async function (req, res) {
    const options = {
        offset: req.query.offset || 0,
        limit: req.query.limit || 0,
        status: req.query.status,
        includePagination: req.query.includePagination,
    };

    const userId = req.params.id;
    try {
        const results = await userAccountsService.retrieveTeamsByUserId(userId, options);
        if (options.includePagination) {
            logger.debug(`Success: Retrieved ${results.data.length} of ${results.pagination.total} total team(s)`);
        }
        else {
            logger.debug(`Success: Retrieved ${results.length} team(s)`);
        }
        return res.status(200).send(results);
    } catch (err) {
        console.log("retrieveTeamsByUserId");
        console.log(err);
        logger.error('Failed with error: ' + err);
        return res.status(500).send('Unable to get teams. Server error.');
    }
};