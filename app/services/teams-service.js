'use strict';

const regexValidator = require('../lib/regex');
const UserAccount = require('../models/user-account-model');
const userAccountsService = require('./user-accounts-service');
const BaseService = require('./_base.service');
const { MissingParameterError, BadlyFormattedParameterError, NotFoundError } = require('../exceptions');
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
        return await this.repository.create(data);
    }
    

    async updateFull(teamId, data) {
        return await this.repository.updateFull(teamId, data);
    }
    

    async delete(teamId) {
        if (!teamId) {
            throw new MissingParameterError;
        }

        const team = await this.repository.model.findOneAndRemove({ 'id': teamId });
            //Note: userAccount is null if not found
        return team;

    }

    async retrieveAllUsers(teamId, options) {
    if (!teamId) {
        throw new MissingParameterError('teamId');
    }
            try {
                const team = await this.repository.model.findOne({ 'id': teamId })
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