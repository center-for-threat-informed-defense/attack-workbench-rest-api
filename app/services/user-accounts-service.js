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

    async delete (userAccountId) {
        if (!userAccountId) {
            throw new MissingParameterError('userId');
        }
    
        try {
            const userAccount = await UserAccount.findOneAndRemove({ 'id': userAccountId }).exec();
            return userAccount;
        } catch (err) {
            throw err;
        }
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

    async retrieveTeamsByUserId (userAccountId, options) {
        if (!userAccountId) {
            throw new MissingParameterError('userId');
        }
    
        // Build the aggregation
        const aggregation = [
            { $sort: { 'name': 1 } },
            {
                $match: {
                    userIDs: { $in: [userAccountId] }
                }
            },
            {
                $facet: {
                    totalCount: [{ $count: 'totalCount' }],
                    documents: []
                }
            }
        ];
    
        if (options.offset) {
            aggregation[2].$facet.documents.push({ $skip: options.offset });
        } else {
            aggregation[2].$facet.documents.push({ $skip: 0 });
        }
    
        if (options.limit) {
            aggregation[2].$facet.documents.push({ $limit: options.limit });
        }
    
        try {
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
            } else {
                return teams;
            }
        } catch (err) {
            throw err;
        }
    };
    

}

module.exports = new UserAccountsService('null', UserAccountsRespository);