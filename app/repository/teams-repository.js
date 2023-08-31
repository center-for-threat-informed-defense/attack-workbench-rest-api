const Team = require('../models/team-model'); // Import the Team model appropriately

exports.findTeamsByUserId = function(userAccountId, options) {
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

    return Team.aggregate(aggregation).exec();
};
