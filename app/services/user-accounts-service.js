'use strict';

const uuid = require('uuid');
const UserAccount = require('../models/user-account-model');
const Team = require('../models/team-model');
const regexValidator = require('../lib/regex');
const UserAccountsRespository = require('../repository/user-accounts-repository');
const TeamstRespository = require('../repository/teams-repository');
const BaseService = require('./_base.service');
const { MissingParameterError, BadlyFormattedParameterError } = require('../exceptions');

class UserAccountsService extends BaseService {

    errors = {
        missingParameter: 'Missing required parameter',
        badlyFormattedParameter: 'Badly formatted parameter',
        duplicateId: 'Duplicate id',
        duplicateEmail: 'Duplicate email',
        notFound: 'Document not found',
        invalidQueryStringParameter: 'Invalid query string parameter'
    };

    addEffectiveRole(userAccount) {
    // Initially, this forces all pending and inactive accounts to have the role 'none'.
    // TBD: Make the role configurable
        if (userAccount?.status === 'pending' || userAccount?.status === 'inactive') {
            userAccount.role = 'none';
        }
    }

    addEffectiveRole = addEffectiveRole;

    userAccountAsIdentity(userAccount) {
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


    userAccountAsIdentity = userAccountAsIdentity;

    async retrieveByEmail(email) {
        if (!email) {
            throw new MissingParameterError("email");
        }

        try {
            const userAccount = await UserAccount.findOne({ 'email': email }).lean();
            addEffectiveRole(userAccount);

            return userAccount;
        }
        catch(err) {
            if (err.name === 'CastError') {
                throw new BadlyFormattedParameterError("email");
            } else {
                throw err;
            }
        }
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

    async getLatest(userAccountId) {
        const userAccount = await UserAccount
            .findOne({ 'id': userAccountId })
            .lean()
            .exec();
        addEffectiveRole(userAccount);

        return userAccount;
    }

    async addCreatedByUserAccount(attackObject) {
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
    addCreatedByUserAccount = addCreatedByUserAccount;

    async addCreatedByUserAccountToAll(attackObjects) {
        for (const attackObject of attackObjects) {
            // eslint-disable-next-line no-await-in-loop
            await addCreatedByUserAccount(attackObject);
        }
    }

    exports.retrieveTeamsByUserId = function (userAccountId, options, callback) {
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

}

module.exports = new UserAccountsService('null', UserAccountsRespository);