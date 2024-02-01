'use strict';

const uuid = require('uuid');
const UserAccount = require('../models/user-account-model');
const Team = require('../models/team-model');
const regexValidator = require('../lib/regex');
const UserAccountsRespository = require('../repository/user-accounts-repository');
const TeamstRespository = require('../repository/teams-repository');
const { MissingParameterError, BadlyFormattedParameterError } = require('../exceptions');

class UserAccountsService {

    constructor(type, repository) {
        super();
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
    static isCallback(arg) {
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
    
    async create(data, options, callback) {

        if (this.isCallback(arguments[arguments.length - 1])) {
            callback = arguments[arguments.length - 1];
        }

        // eslint-disable-next-line no-useless-catch
        try {
            // This function handles two use cases:
            //   1. This is a completely new object. Create a new object and generate the stix.id if not already
            //      provided. Set both stix.created_by_ref and stix.x_mitre_modified_by_ref to the organization identity.
            //   2. This is a new version of an existing object. Create a new object with the specified id.
            //      Set stix.x_mitre_modified_by_ref to the organization identity.

            options = options || {};
            if (!options.import) {
                // Set the ATT&CK Spec Version
                data.stix.x_mitre_attack_spec_version = data.stix.x_mitre_attack_spec_version ?? config.app.attackSpecVersion;

                // Record the user account that created the object
                if (options.userAccountId) {
                    data.workspace.workflow.created_by_user_account = options.userAccountId;
                }

                // Set the default marking definitions
                await attackObjectsService.setDefaultMarkingDefinitions(data);

                // Get the organization identity
                const organizationIdentityRef = await systemConfigurationService.retrieveOrganizationIdentityRef();

                // Check for an existing object
                let existingObject;
                if (data.stix.id) {
                    existingObject = await this.repository.retrieveOneById(data.stix.id);
                }

                if (existingObject) {
                    // New version of an existing object
                    // Only set the x_mitre_modified_by_ref property
                    data.stix.x_mitre_modified_by_ref = organizationIdentityRef;
                }
                else {
                    // New object
                    // Assign a new STIX id if not already provided
                    if (!data.stix.id) {
                        // const stixIdPrefix = getStixIdPrefixFromModel(this.model.modelName, data.stix.type);
                        data.stix.id = `${data.stix.type}--${uuid.v4()}`;
                    }

                    // Set the created_by_ref and x_mitre_modified_by_ref properties
                    data.stix.created_by_ref = organizationIdentityRef;
                    data.stix.x_mitre_modified_by_ref = organizationIdentityRef;
                }
            }
            const res = await this.repository.save(data);
            if (callback) {
                return callback(null, res);
            }
            return res;
        } catch (err) {
            if (callback) {
                return callback(err);
            }
            throw err;
        }
    }

    async retrieveAll (options) {
        const res = await this.repository.retrieveAll(options);
        return res;
    };

    async updateFull (userAccountId, data) {
        try {
            if (!userAccountId) {
                const error = new Error(errors.missingParameter);
                error.parameterName = 'userId';
                throw error;
            }
    
            const document = await UserAccount.findOne({ 'id': userAccountId });
    
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