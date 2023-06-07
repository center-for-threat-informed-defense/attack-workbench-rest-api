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

function addEffectiveRole (userAccount) {
  // Initially, this forces all pending and inactive accounts to have the role 'none'.
  // TBD: Make the role configurable
  if (userAccount?.status === 'pending' || userAccount?.status === 'inactive') {
      userAccount.role = 'none';
  }
}

exports.addEffectiveRole = addEffectiveRole;

function userAccountAsIdentity (userAccount) {
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

exports.retrieveAll = function(options, callback) {
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
    // - Then apply query, skip and limit options
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

    // Retrieve the documents
    UserAccount.aggregate(aggregation, function(err, results) {
        if (err) {
            return callback(err);
        }
        else {
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
                return callback(null, returnValue);
            } else {
                return callback(null, userAccounts);
            }
        }
    });
};

exports.retrieveById = function(userAccountId, options, callback) {
    if (!userAccountId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'userId';
        return callback(error);
    }

    UserAccount.findOne({ 'id': userAccountId })
        .lean()
        .exec(function (err, userAccount) {
            if (err) {
                if (err.name === 'CastError') {
                    const error = new Error(errors.badlyFormattedParameter);
                    error.parameterName = 'userId';
                    return callback(error);
                } else {
                    return callback(err);
                }
            } else {
                addEffectiveRole(userAccount);
                if (options.includeStixIdentity) {
                    userAccount.identity = userAccountAsIdentity(userAccount);
                }
                return callback(null, userAccount);
            }
        });
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

exports.updateFull = function(userAccountId, data, callback) {
    if (!userAccountId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'userId';
        return callback(error);
    }

    UserAccount.findOne({ 'id': userAccountId }, function(err, document) {
        if (err) {
            if (err.name === 'CastError') {
                var error = new Error(errors.badlyFormattedParameter);
                error.parameterName = 'userId';
                return callback(error);
            }
            else {
                return callback(err);
            }
        }
        else if (!document) {
            // document not found
            return callback(null);
        }
        else {
            // Copy data to found document
            document.email = data.email;
            document.username = data.username;
            document.displayName = data.displayName;
            document.status = data.status;
            document.role = data.role;

            // Set the modified timestamp
            document.modified = new Date().toISOString();

            // And save
            document.save(function(err, savedDocument) {
                if (err) {
                    if (err.name === 'MongoServerError' && err.code === 11000) {
                        // 11000 = Duplicate index
                        var error = new Error(errors.duplicateId);
                        return callback(error);
                    }
                    else {
                        return callback(err);
                    }
                }
                else {
                    return callback(null, savedDocument);
                }
            });
        }
    });
};

exports.delete = function (userAccountId, callback) {
    if (!userAccountId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'userId';
        return callback(error);
    }

    UserAccount.findOneAndRemove({ 'id': userAccountId }, function (err, userAccount) {
        if (err) {
            return callback(err);
        } else {
            //Note: userAccount is null if not found
            return callback(null, userAccount);
        }
    });
};

async function getLatest(userAccountId) {
    const userAccount = await UserAccount
        .findOne({ 'id': userAccountId })
        .lean()
        .exec();
    addEffectiveRole(userAccount);

    return userAccount;
}

async function addCreatedByUserAccount(attackObject) {
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

exports.retrieveTeamsByUserId = function(userAccountId, options, callback) {
    if (!userAccountId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'userId';
        return callback(error);
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

    // Retrieve the documents
    Team.aggregate(aggregation, function (err, results) {
        if (err) {
            return callback(err);
        }
        else {
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
                return callback(null, returnValue);
            }
            else {
                return callback(null, teams);
            }
        }
    });
};
