'use strict';

const uuid = require('uuid');
const UserAccount = require('../models/user-account-model');
const userAccountsRepository = require('../repository/user-accounts-repository');
const teamsRepository = require('../repository/teams-repository');
const Errors = require('../exceptions');

const errors = {
    missingParameter: 'Missing required parameter',
    badlyFormattedParameter: 'Badly formatted parameter',
    duplicateId: 'Duplicate id',
    duplicateEmail: 'Duplicate email',
    notFound: 'Document not found',
    invalidQueryStringParameter: 'Invalid query string parameter'
};
exports.errors = errors;

const addEffectiveRole = function (userAccount) {
  // Initially, this forces all pending and inactive accounts to have the role 'none'.
  // TBD: Make the role configurable
  if (userAccount?.status === 'pending' || userAccount?.status === 'inactive') {
      userAccount.role = 'none';
  }
}
// We separate the exports statement because the functions are used in this module
exports.addEffectiveRole = this.addEffectiveRole;

const userAccountAsIdentity = function (userAccount) {
  return {
      type: 'identity',
      spec_version: '2.1',
      id: userAccount.id,
      created: userAccount.created,
      modified: userAccount.modified,
      name: userAccount.displayName,
      identity_class: 'individual'
  }
}
exports.userAccountAsIdentity = userAccountAsIdentity;

exports.retrieveAll = async function (options) {

    let results;
    try {
        results = await userAccountsRepository.retrieveAll(options);
    } catch (err) {
        throw new Errors.DatabaseError({ detail: 'Failed to retrieve records from the userAccounts repository', originalError: err.message });
    }

    const userAccounts = results[0].documents;
        userAccounts.forEach(userAccount => {
            addEffectiveRole(userAccount);
            if (options.includeStixIdentity) {
                userAccount.identity = userAccountAsIdentity(userAccount);
            }
        });

        if (options.includePagination) {
            let derivedTotalCount = 0;
            if (results[0].totalCount.length > 0) {
                derivedTotalCount = results[0].totalCount[0].totalCount;
            }
            const returnValue = {
                pagination: {
                    total: derivedTotalCount,
                    offset: options.offset,
                    limit: options.limit
                },
                data: userAccounts
            };
            return returnValue;
        } else {
            return userAccounts;
        }
};

exports.retrieveById = async function (userAccountId, options) {
    if (!userAccountId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'userId';
        throw error;
    }

    try {
        const userAccount = await userAccountsRepository.findOneById(userAccountId);

        if (!userAccount) {
            throw new Error('UserAccount not found.');
        }

        addEffectiveRole(userAccount);
        if (options.includeStixIdentity) {
            userAccount.identity = userAccountAsIdentity(userAccount);
        }

        return userAccount;

    } catch (err) {
        if (err.name === 'CastError') {
            const error = new Error(errors.badlyFormattedParameter);
            error.parameterName = 'userId';
            throw error;
        } else {
            throw err;
        }
    }
};

exports.retrieveByEmail = async function(email) {
    if (!email) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'email';
        throw error;
    }

    try {
        const userAccount = await userAccountsRepository.findOneByEmail(email);
        if (!userAccount) {
            throw new Error('UserAccount not found for the provided email.');
        }

        addEffectiveRole(userAccount);

        return userAccount;
    }
    catch(err) {
        if (err.name === 'CastError') {
            const error = new Error(errors.badlyFormattedParameter);
            error.parameterName = 'email';
            throw error;
        } else {
            throw err;
        }
    }
};

exports.createIsAsync = true;
exports.create = async function(data) {
    // Check for a duplicate email
    if (data.email) {
        const existingUserAccount = await userAccountsRepository.findByEmail(data.email);
        if (existingUserAccount) {
            throw new Error(errors.duplicateEmail);
        }
    }

    const entityProps = {
        ...data,

        // Create a unique id for this user
        // This should usually be undefined. It will only be defined when migrating user accounts from another system.
        id: data.id || `identity--${uuid.v4()}`,

        // Add a timestamp recording when the user account was first created
        // This should usually be undefined. It will only be defined when migrating user accounts from another system.
        created: data.created || new Date().toISOString(),

        // Add a timestamp recording when the user account was last modified
        modified: data.modified || (data.created || new Date().toISOString())
    };

    // Create the document
    const userAccount = new UserAccount(entityProps);

    // Save the document in the database
    try {
        const savedUserAccount = await userAccountsRepository.save(userAccount);
        addEffectiveRole(savedUserAccount);

        return savedUserAccount;
    } 
    catch (err) {
        if (err.name === 'MongoServerError' && err.code === 11000) {
            // 11000 = Duplicate index
            const error = new Error(errors.duplicateId);
            throw error;
        }
        else {
            throw err;
        }
    }
};

exports.updateFull = async function (userAccountId, data) {
    if (!userAccountId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'userId';
        throw error;
    }

    try {
        const updatedDocument = await userAccountsRepository.updateById(userAccountId, data);
        return updatedDocument;

    } catch (err) {
        if (err.name === 'CastError') {
            const error = new Error(errors.badlyFormattedParameter);
            error.parameterName = 'userId';
            throw error;
        } else if (err.name === 'MongoServerError' && err.code === 11000) {
            // 11000 = Duplicate index
            const error = new Error(errors.duplicateId);
            throw error;
        } else {
            throw err;
        }
    }
};

exports.delete = async function (userAccountId) {
    if (!userAccountId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'userId';
        throw error;
    }

    // eslint-disable-next-line no-useless-catch
    try {
        return await userAccountsRepository.removeById(userAccountId);
    } catch (err) {
        // TODO do something with the error
        throw err;
    }
};

async function getLatest(userAccountId) {
    const userAccount = await userAccountsRepository.findOneById(userAccountId);
    addEffectiveRole(userAccount);

    return userAccount;
}

const addCreatedByUserAccount = async function (attackObject) {
    if (attackObject?.workspace?.workflow?.created_by_user_account) {
        try {
            // eslint-disable-next-line require-atomic-updates
            attackObject.created_by_user_account = await getLatest(attackObject.workspace.workflow.created_by_user_account);
        }
        catch(err) {
            // Ignore lookup errors
        }
    }
}
exports.addCreatedByUserAccount = addCreatedByUserAccount;

exports.addCreatedByUserAccountToAll = async function(attackObjects) {
    for (const attackObject of attackObjects) {
        // eslint-disable-next-line no-await-in-loop
        await addCreatedByUserAccount(attackObject);
    }
}

// TODO migrate database logic to user-accounts-repository.js
exports.retrieveTeamsByUserId = async function (userAccountId, options) {
    if (!userAccountId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'userId';
        throw error;
    }

    // eslint-disable-next-line no-useless-catch
    try {
        const results = await teamsRepository.findTeamsByUserId(userAccountId, options);

        if (options.includePagination) {
            let derivedTotalCount = 0;
            if (results.totalCount.length > 0) {
                derivedTotalCount = results.totalCount[0].totalCount;
            }
            const returnValue = {
                pagination: {
                    total: derivedTotalCount,
                    offset: options.offset,
                    limit: options.limit
                },
                data: results.documents
            };
            return returnValue;
        } else {
            return results.documents;
        }
    } catch (err) {
        // TODO do something with the error
        throw err;
    }
};