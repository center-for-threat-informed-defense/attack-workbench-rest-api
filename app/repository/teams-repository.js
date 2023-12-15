/* eslint-disable class-methods-use-this */
const Team = require('../models/team-model'); // Import the Team model appropriately
const BaseRepository = require('./_base.repository');

class TeamsRepository extends BaseRepository {

    // TODO decouple DB logic; migrate DB logic to DAO/repository class
    findTeamsByUserId(userAccountId, options) {
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
}

module.exports = new TeamsRepository(Team);

