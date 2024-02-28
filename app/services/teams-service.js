'use strict';

const uuid = require('uuid');
const Team = require('../models/team-model');
const regexValidator = require('../lib/regex');
const UserAccount = require('../models/user-account-model');
const userAccountsService = require('./user-accounts-service');
const BaseService = require('./_base.service');
const { MissingParameterError, BadlyFormattedParameterError, NotFoundError, DuplicateIdError } = require('../exceptions');
const teamsRepository = require('../repository/teams-repository');


class TeamsService extends BaseService {

    errors = {
        missingParameter: 'Missing required parameter',
        badlyFormattedParameter: 'Badly formatted parameter',
        duplicateId: 'Duplicate id',
        notFound: 'Document not found',
        invalidQueryStringParameter: 'Invalid query string parameter',
        duplicateName: 'Duplicate name',
    }

    async retrieveAll(options) {
        return await this.repository.retrieveAll(options);
    }
    
    async retrieveById(teamId) {
        return await this.repository.retrieveById(teamId);
    }

    async create(data) {
        try {
            // Create the document
            const team = new Team(data);
    
            // Create a unique id for this team
            // This should usually be undefined. It will only be defined when migrating teams from another system.
            if (!team.id) {
                team.id = `identity--${uuid.v4()}`;
            }
    
            // Add a timestamp recording when the team was first created
            // This should usually be undefined. It will only be defined when migrating teams from another system.
            if (!team.created) {
                team.created = new Date().toISOString();
            }
    
            // Add a timestamp recording when the team was last modified
            if (!team.modified) {
                team.modified = team.created;
            }
    
            // Save the document in the database
            const savedTeam = await team.save();
            return savedTeam;
        } catch (err) {
            if (err.name === 'MongoServerError' && err.code === 11000) {
                // 11000 = Duplicate index
                const error = err.message.includes('name_') ? new Error(this.errors.duplicateName) : new DuplicateIdError;
                throw error;
            } else {
                throw err;
            }
        }
    }
    

    async updateFull(teamId, data) {
        try {
            if (!teamId) {
                throw new MissingParameterError;
            }
    
            const document = await Team.findOne({ 'id': teamId });
    
            if (!document) {
                // Document not found
                return null;
            }
    
            // Copy data to found document
            document.name = data.name;
            document.description = data.description;
            document.userIDs = data.userIDs;
    
            // Set the modified timestamp
            document.modified = new Date().toISOString();
    
            // And save
            const savedDocument = await document.save();
    
            return savedDocument;
        } catch (err) {
            if (err.name === 'CastError') {
                throw new BadlyFormattedParameterError;
            } else if (err.name === 'MongoServerError' && err.code === 11000) {
                // 11000 = Duplicate index
                const error = err.message.includes('name_') ? new Error(this.errors.duplicateName) : new DuplicateIdError;
                throw error;
            } else {
                throw err;
            }
        }
    }
    

    async delete(teamId) {
        if (!teamId) {
            throw new MissingParameterError;
        }

        try {
            const team = await Team.findOneAndRemove({ 'id': teamId });
                //Note: userAccount is null if not found
            return team;
        } catch (err) {
            throw err;
        }

    };

    async retrieveAllUsers(teamId, options) {
    if (!teamId) {
        throw new MissingParameterError('teamId');
    }
            try {
                const team = await Team.findOne({ 'id': teamId })
                .lean()
                .exec();
                if (!team) {
                    throw new NotFoundError;
                }
                const matchQuery = {'id': {$in: team.userIDs}};
                const aggregation = [
                    { $sort: { 'username': 1 } },
                    { $match: matchQuery }
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

    
                    try {
                        const results = await UserAccount.aggregate(aggregation);
                        const userAccounts = results[0].documents;
                        userAccounts.forEach(userAccount => {
                            userAccountsService.constructor.addEffectiveRole(userAccount);
                            if (options.includeStixIdentity) {
                                userAccount.identity = userAccountsService.constructor.userAccountAsIdentity(userAccount);
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
            } 
            catch (err) {
                if (err.name === 'CastError') {
                    throw new BadlyFormattedParameterError("teamId");
                } else {
                    throw err;
                }
            }
        }
        catch (err) {
            if (err.name === 'CastError') {
                throw new BadlyFormattedParameterError("teamId");
            } else {
                throw err;
            }
        }
    }

}

module.exports = new TeamsService(null, teamsRepository);