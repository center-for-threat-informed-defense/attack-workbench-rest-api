'use strict';

const BaseRepository = require('./_base.repository');
const AttackObject = require('../models/attack-object-model');
const { lastUpdatedByQueryHelper } = require('../lib/request-parameter-helper');

const regexValidator = require('../lib/regex');

class AttackObjectsRepository extends BaseRepository {

    errors = {
        missingParameter: 'Missing required parameter',
        badlyFormattedParameter: 'Badly formatted parameter',
        duplicateId: 'Duplicate id',
        notFound: 'Document not found',
        invalidQueryStringParameter: 'Invalid query string parameter',
        duplicateCollection: 'Duplicate collection'
    };

    identitiesService;

    async retrieveAll(options) {
        // require here to avoid circular dependency
        const relationshipsService = require('../services/relationships-service');

        // Build the query
        const query = {};
        if (typeof options.attackId !== 'undefined') {
            if (Array.isArray(options.attackId)) {
                query['workspace.attack_id'] = { $in: options.attackId };
            }
            else {
                query['workspace.attack_id'] = options.attackId;
            }
        }
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
        const aggregation = [];
        if (options.versions === 'latest') {
            // - Group the documents by stix.id, sorted by stix.modified
            // - Use the first document in each group (according to the value of stix.modified)
            aggregation.push({ $sort: { 'stix.id': 1, 'stix.modified': -1 } });
            aggregation.push({ $group: { _id: '$stix.id', document: { $first: '$$ROOT' } } });
            aggregation.push({ $replaceRoot: { newRoot: '$document' } });
        }

        // - Then apply query, skip and limit options
        aggregation.push({ $sort: { 'stix.id': 1 } });
        aggregation.push({ $match: query });

        if (typeof options.search !== 'undefined') {
            options.search = regexValidator.sanitizeRegex(options.search);
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

        // Retrieve the documents
        let documents = await this.model.aggregate(aggregation);

        // Add relationships from separate collection
        if (!options.attackId && !options.search) {
            const relationshipsOptions = {
                includeRevoked: options.includeRevoked,
                includeDeprecated: options.includeDeprecated,
                state: options.state,
                versions: options.versions,
                lookupRefs: false,
                includeIdentities: false,
                lastUpdatedBy: options.lastUpdatedBy
            };
            const relationships = await relationshipsService.retrieveAll(relationshipsOptions);
            documents = documents.concat(relationships);
        }

        // Apply pagination
        const offset = options.offset ?? 0;
        const limit = options.limit ?? 0;

        let paginatedDocuments;
        if (limit > 0) {
            paginatedDocuments = documents.slice(offset, offset + limit);
        }
        else {
            paginatedDocuments = documents.slice(offset);
        }

        // Mimic the format that the base repository uses to return documents
        return [{
            documents: paginatedDocuments,
            totalCount: [ { totalCount: documents.length } ]
        }];
    }
}

module.exports = new AttackObjectsRepository(AttackObject);