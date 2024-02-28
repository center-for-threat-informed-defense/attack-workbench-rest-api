/* eslint-disable class-methods-use-this */
const Team = require('../models/team-model'); // Import the Team model appropriately
const BaseRepository = require('./_base.repository');
const regexValidator = require('../lib/regex');

class TeamsRepository extends BaseRepository {

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
}

module.exports = new TeamsRepository(Team);

