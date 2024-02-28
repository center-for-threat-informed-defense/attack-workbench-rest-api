/* eslint-disable class-methods-use-this */
const Team = require('../models/team-model'); // Import the Team model appropriately
const BaseRepository = require('./_base.repository');
const regexValidator = require('../lib/regex');
const uuid = require('uuid');
const UserAccount = require('../models/user-account-model');
const userAccountsService = require('../services/user-accounts-service');
const { BadlyFormattedParameterError, MissingParameterError, DuplicateIdError } = require('../exceptions');

class TeamsRepository extends BaseRepository {

    errors = {
        missingParameter: 'Missing required parameter',
        badlyFormattedParameter: 'Badly formatted parameter',
        duplicateId: 'Duplicate id',
        notFound: 'Document not found',
        invalidQueryStringParameter: 'Invalid query string parameter',
        duplicateName: 'Duplicate name',
    }

    // TODO decouple DB logic; migrate DB logic to DAO/repository class
    retrieveByUserId(userAccountId, options) {
        const aggregation = [
            { $sort: { 'name': 1 } },
            { $match: { userIDs: { $in: [userAccountId] } } },
            {
                $facet: {
                    totalCount: [{ $count: 'totalCount' }],
                    documents: [
                        { $skip: options.offset || 0 },
                        ...options.limit ? [{ $limit: options.limit }] : []
                    ]
                }
            }
        ];

        return this.model.aggregate(aggregation).exec();
    }

    async retrieveAll(options) {
        try {
            // Build the aggregation
            const aggregation = [
                { $sort: { 'name': 1 } },
            ];
    
            if (typeof options.search !== 'undefined') {
                options.search = regexValidator.sanitizeRegex(options.search);
                const match = { $match: { $or: [
                            { 'name': { '$regex': options.search, '$options': 'i' }},
                            { 'description': { '$regex': options.search, '$options': 'i' }},
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
            const results = await Team.aggregate(aggregation);
    
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
    }

    async retrieveById(teamId) {
        try {
            if (!teamId) {
               throw new MissingParameterError;
            }
    
            const team = await Team.findOne({ 'id': teamId }).lean().exec();
    
            return team;
        } catch (err) {
            if (err.name === 'CastError') {
                throw new BadlyFormattedParameterError;
            } else {
                throw err;
            }
        }
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
}

module.exports = new TeamsRepository(Team);

