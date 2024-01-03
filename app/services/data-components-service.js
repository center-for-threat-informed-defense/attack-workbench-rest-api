'use strict';

const identitiesService = require('./identities-service');

const DataComponentsRepository = require('../repository/data-components-repository.js');

const BaseService = require('./_base.service');

class DataComponentsService extends BaseService {

    async retrieveAllAsync(options) {
        // Build the query
        const query = {};
        if (!options.includeRevoked) {
            query['stix.revoked'] = { $in: [null, false] };
        }
        if (!options.includeDeprecated) {
            query['stix.x_mitre_deprecated'] = { $in: [null, false] };
        }
        if (typeof options.state !== 'undefined') {
            if (Array.isArray(options.state)) {
                query['workspace.workflow.state'] = { $in: options.state };
            } else {
                query['workspace.workflow.state'] = options.state;
            }
        }

        // Build the aggregation
        // - Group the documents by stix.id, sorted by stix.modified
        // - Use the first document in each group (according to the value of stix.modified)
        // - Then apply query, skip and limit options
        const aggregation = [
            { $sort: { 'stix.id': 1, 'stix.modified': -1 } },
            { $group: { _id: '$stix.id', document: { $first: '$$ROOT' } } },
            { $replaceRoot: { newRoot: '$document' } },
            { $sort: { 'stix.id': 1 } },
            { $match: query }
        ];

        if (typeof options.search !== 'undefined') {
            const match = {
                $match: {
                    $or: [
                        { 'stix.name': { '$regex': options.search, '$options': 'i' } },
                        { 'stix.description': { '$regex': options.search, '$options': 'i' } }
                    ]
                }
            };
            aggregation.push(match);
        }

        const facet = {
            $facet: {
                totalCount: [{ $count: 'totalCount' }],
                documents: []
            }
        };
        if (options.offset) {
            facet.$facet.documents.push({ $skip: options.offset });
        } else {
            facet.$facet.documents.push({ $skip: 0 });
        }
        if (options.limit) {
            facet.$facet.documents.push({ $limit: options.limit });
        }
        aggregation.push(facet);

        // Retrieve the documents
        const results = await this.repository.model.aggregate(aggregation);
        await identitiesService.addCreatedByAndModifiedByIdentitiesToAll(results[0].documents);

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
                data: results[0].documents
            };
            return returnValue;
        }
        else {
            return results[0].documents;
        }
    }

}

module.exports = new DataComponentsService('x-mitre-data-component', DataComponentsRepository);
