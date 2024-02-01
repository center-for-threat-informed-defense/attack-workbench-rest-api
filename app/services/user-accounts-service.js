'use strict';

const uuid = require('uuid');
const UserAccount = require('../models/user-account-model');
const Team = require('../models/team-model');
const regexValidator = require('../lib/regex');
const UserAccountsRespository = require('../repository/user-accounts-repository');
const TeamstRespository = require('../repository/teams-repository');
const { MissingParameterError, BadlyFormattedParameterError, DuplicateIdError } = require('../exceptions');

class UserAccountsService {

    constructor(type, repository) {
        this.type = type;
        this.repository = repository;
    }

    errors = {
        missingParameter: 'Missing required parameter',
        badlyFormattedParameter: 'Badly formatted parameter',
        duplicateId: 'Duplicate id',
        duplicateEmail: 'Duplicate email',
        notFound: 'Document not found',
        invalidQueryStringParameter: 'Invalid query string parameter'
    };

    // Helper function to determine if the last argument is a callback
    isCallback(arg) {
        return typeof arg === 'function';
    }

    addEffectiveRole(userAccount) {
    // Initially, this forces all pending and inactive accounts to have the role 'none'.
    // TBD: Make the role configurable
        if (userAccount?.status === 'pending' || userAccount?.status === 'inactive') {
            userAccount.role = 'none';
        }
    }

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


    async retrieveByEmail(email) {
        if (!email) {
            throw new MissingParameterError("email");
        }

        try {
            const userAccount = await this.repository.retrieveOneByEmail(email);
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
            const userAccount = await this.repository.findOneAndRemove(userAccountId);
            return userAccount;
        } catch (err) {
            throw err;
        }
    };

    async retrieveById (userAccountId, options) {
        try {
            if (!userAccountId) {
                throw new MissingParameterError('userId');
            }
    
            const userAccount = await this.repository.retrieveOneById(userAccountId);
    
            if (!userAccount) {
                return null; // Document not found
            }
    
            addEffectiveRole(userAccount);
    
            if (options.includeStixIdentity) {
                userAccount.identity = userAccountAsIdentity(userAccount);
            }
    
            return userAccount;
        } catch (err) {
            if (err.name === 'CastError') {
                throw new BadlyFormattedParameterError('userId');
            } else {
                throw err;
            }
        }
    };
    
    
    createIsAsync = true;
    async create(data) {
        // Check for a duplicate email
        if (data.email) {
            // Note: We could try to insert the new document without this check and allow Mongoose to throw a duplicate
            // index error. But the Error that's thrown doesn't allow us to distinguish between a duplicate id (which is
            // unexpected and may indicate a deeper problem) and a duplicate email (which is likely a client error).
            // So we perform this check here to catch the duplicate email and then treat the duplicate index as a server
            // error if it occurs.
            const userAccount = await this.repository.retrieveOneById(data.email);
            if (userAccount) {
                throw new DuplicateIdError;
            }
        }
    
        // Create the document
        const userAccount = await this.repository.createNewDocument(data);
    
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
            const savedUserAccount = await this.repository.save(userAccount);
            this.addEffectiveRole(savedUserAccount);
    
            return savedUserAccount;
        }
        catch (err) {
            if (err.name === 'MongoServerError' && err.code === 11000) {
                throw new DuplicateIdError;
            }
            else {
                throw err;
            }
        }
    }

    async retrieveAll (options) {
        const res = await this.repository.retrieveAll(options);
        return res;
    };

    async updateFull (userAccountId, data) {
        try {
            if (!userAccountId) {
                throw new MissingParameterError('userId');
            }
    
            const document = await this.repository.retrieveOneById(userAccountId);
    
            if (!document) {
                // Document not found
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
            const savedDocument = await this.repository.saveDocument(document);
    
            return savedDocument;
        } catch (err) {
            if (err.name === 'CastError') {
                throw new BadlyFormattedParameterError('userId');
            } else if (err.name === 'MongoServerError' && err.code === 11000) {
                throw new DuplicateIdError;
            } else {
                throw err;
            }
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

module.exports = new UserAccountsService(null, UserAccountsRespository);