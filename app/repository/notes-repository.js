'use strict';

const BaseRepository = require('./_base.repository');
const Note = require('../models/note-model');
const regexValidator = require('../lib/regex');
const { lastUpdatedByQueryHelper } = require('../lib/request-parameter-helper');
const { DatabaseError } = require('../exceptions');

class NotesRepository extends BaseRepository {
    async retrieveAll(options) {
        try {
            // Build the query
            const query = {};

            // Build the query
            if (!options.includeRevoked) {
                query['stix.revoked'] = { $in: [null, false] };
            }
            if (!options.includeDeprecated) {
                query['stix.x_mitre_deprecated'] = { $in: [null, false] };
            }
            if (typeof options.state !== 'undefined') {
                if (Array.isArray(options.state)) {
                    query['workspace.workflow.state'] = { $in: options.state };
                }
                else {
                    query['workspace.workflow.state'] = options.state;
                }
            }
            if (typeof options.lastUpdatedBy !== 'undefined') {
                query['workspace.workflow.created_by_user_account'] = lastUpdatedByQueryHelper(options.lastUpdatedBy);
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
                options.search = regexValidator.sanitizeRegex(options.search);
                const match = { $match: { $or: [
                            { 'stix.abstract': { '$regex': options.search, '$options': 'i' }},
                            { 'stix.content': { '$regex': options.search, '$options': 'i' }}
                        ]}};
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
            }
            else {
                facet.$facet.documents.push({ $skip: 0 });
            }
            if (options.limit) {
                facet.$facet.documents.push({ $limit: options.limit });
            }
            aggregation.push(facet);

            // Retrieve the documents
            return await this.model.aggregate(aggregation).exec();
        } catch (err) {
            throw new DatabaseError(err);
        }
    }
}

module.exports = new NotesRepository(Note);