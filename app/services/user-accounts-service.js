'use strict';

const uuid = require('uuid');
const UserAccount = require('../models/user-account-model');
const Team = require('../models/team-model');
const regexValidator = require('../lib/regex');

const errors = {
    missingParameter: 'Missing required parameter',
    badlyFormattedParameter: 'Badly formatted parameter',
    duplicateId: 'Duplicate id',
    duplicateEmail: 'Duplicate email',
    notFound: 'Document not found',
    invalidQueryStringParameter: 'Invalid query string parameter'
};
exports.errors = errors;

exports.addEffectiveRole = function (userAccount) {
  // Initially, this forces all pending and inactive accounts to have the role 'none'.
  // TBD: Make the role configurable
  if (userAccount?.status === 'pending' || userAccount?.status === 'inactive') {
      userAccount.role = 'none';
  }
}

exports.userAccountAsIdentity = function (userAccount) {
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

exports.retrieveAll = async function (options) {
    // Build the query
    const query = {};
    if (typeof options.status !== 'undefined') {
        if (Array.isArray(options.status)) {
            query['status'] = { $in: options.status };
        }
        else {
            query['status'] = options.status;
        }
    }

    if (typeof options.role !== 'undefined') {
        if (Array.isArray(options.role)) {
            query['role'] = { $in: options.role };
        }
        else {
            query['role'] = options.role;
        }
    }

    // Build the aggregation
    // - Then apply query, skip, and limit options
    const aggregation = [
        { $sort: { 'username': 1 } },
        { $match: query }
    ];

    if (typeof options.search !== 'undefined') {
        options.search = regexValidator.sanitizeRegex(options.search);
        const match = { $match: { $or: [
                    { 'username': { '$regex': options.search, '$options': 'i' }},
                    { 'email': { '$regex': options.search, '$options': 'i' }},
                    { 'displayName': { '$regex': options.search, '$options': 'i' }}
                ]}};
        aggregation.push(match);
    }

    const facet = {
        $facet: {
            totalCount: [ { $count: 'totalCount' }],
            documents: [ ]
        }
    };
    if (options.offset) {
        facet.$facet.documents.push({ $skip: options.offset });
    }
    else {
        facet.$facet.documents.push({ $skip: 0 });
    }
    if (options.limit) {
        facet.$facet.documents.push({ $limit: options.limit });
    }
    aggregation.push(facet);

    // eslint-disable-next-line no-useless-catch
    try {
        // Retrieve the documents
        const results = await UserAccount.aggregate(aggregation).exec();

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
    } catch (err) {
        throw err;
    }
};

exports.retrieveById = async function (userAccountId, options) {
    if (!userAccountId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'userId';
        throw error;
    }

    try {
        const userAccount = await UserAccount.findOne({ 'id': userAccountId }).lean().exec();

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
        const userAccount = await UserAccount.findOne({ 'email': email }).lean();
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
        // Note: We could try to insert the new document without this check and allow Mongoose to throw a duplicate
        // index error. But the Error that's thrown doesn't allow us to distinguish between a duplicate id (which is
        // unexpected and may indicate a deeper problem) and a duplicate email (which is likely a client error).
        // So we perform this check here to catch the duplicate email and then treat the duplicate index as a server
        // error if it occurs.
        const userAccount = await UserAccount.findOne({ 'email': data.email }).lean();
        if (userAccount) {
            throw (new Error(errors.duplicateEmail));
        }
    }

    // Create the document
    const userAccount = new UserAccount(data);

    // Create a unique id for this user
    // This should usually be undefined. It will only be defined when migrating user accounts from another system.
    if (!userAccount.id) {
        userAccount.id = `identity--${uuid.v4()}`;
    }

    // Add a timestamp recording when the user account was first created
    // This should usually be undefined. It will only be defined when migrating user accounts from another system.
    if (!userAccount.created) {
        userAccount.created = new Date().toISOString();
    }

    // Add a timestamp recording when the user account was last modified
    if (!userAccount.modified) {
        userAccount.modified = userAccount.created;
    }

    // Save the document in the database
    try {
        const savedUserAccount = await userAccount.save();
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
        const document = await UserAccount.findOne({ 'id': userAccountId });

        if (!document) {
            // document not found
            return null;
        }

        // Copy data to found document
        document.email = data.email;
        document.username = data.username;
        document.displayName = data.displayName;
        document.status = data.status;
        document.role = data.role;

        // Set the modified timestamp
        document.modified = new Date().toISOString();

        // And save
        const savedDocument = await document.save();

        return savedDocument;

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

    try {
        const userAccount = await UserAccount.findOneAndRemove({ 'id': userAccountId });
        // Note: userAccount is null if not found
        return userAccount;
    } catch (err) {
        throw err;
    }
};

async function getLatest(userAccountId) {
    const userAccount = await UserAccount
        .findOne({ 'id': userAccountId })
        .lean()
        .exec();
    addEffectiveRole(userAccount);

    return userAccount;
}

exports.addCreatedByUserAccount = function (attackObject) {
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

exports.addCreatedByUserAccountToAll = async function(attackObjects) {
    for (const attackObject of attackObjects) {
        // eslint-disable-next-line no-await-in-loop
        await addCreatedByUserAccount(attackObject);
    }
}

exports.retrieveTeamsByUserId = async function (userAccountId, options) {
    if (!userAccountId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'userId';
        throw error;
    }

    // Build the aggregation
    const aggregation = [
        { $sort: { 'name': 1 } },
    ];

    const match = {
        $match: {
            userIDs: { $in: [userAccountId] }
        }
    };

    aggregation.push(match);

    const facet = {
        $facet: {
            totalCount: [{ $count: 'totalCount' }],
            documents: []
        }
    };

    if (options.offset) {
        facet.$facet.documents.push({ $skip: options.offset });
    }
    else {
        facet.$facet.documents.push({ $skip: 0 });
    }
    if (options.limit) {
        facet.$facet.documents.push({ $limit: options.limit });
    }

    aggregation.push(facet);

    // eslint-disable-next-line no-useless-catch
    try {
        // Retrieve the documents
        const results = await Team.aggregate(aggregation).exec();
        const teams = results[0].documents;
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
                data: teams
            };
            return returnValue;
        }
        else {
            return teams;
        }
    } catch (err) {
        throw err;
    }
};
