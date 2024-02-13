'use strict';

const util = require('util');
const { NotImplementedError, BadlyFormattedParameterError, MissingParameterError } = require('../exceptions');
const AttackObject = require('../models/attack-object-model');
const Relationship = require('../models/relationship-model');
const systemConfigurationService = require('./system-configuration-service');
const BaseService = require('./_base.service');
const { lastUpdatedByQueryHelper } = require('../lib/request-parameter-helper');

const regexValidator = require('../lib/regex');

class AttackObjectsService extends BaseService {
    
    errors = {
        missingParameter: 'Missing required parameter',
        badlyFormattedParameter: 'Badly formatted parameter',
        duplicateId: 'Duplicate id',
        notFound: 'Document not found',
        invalidQueryStringParameter: 'Invalid query string parameter',
        duplicateCollection: 'Duplicate collection'
    };

    relationshipPrefix = 'relationship';

    identitiesService;

    async retrieveAll(options, callback) {
        throw new NotImplementedError(this.constructor.name, 'retrieveAll');
    }

    async retrieveById(stixId, options, callback) {
        throw new NotImplementedError(this.constructor.name, 'retrieveById');
    }

    async retrieveVersionById(stixId, modified, callback) {
        throw new NotImplementedError(this.constructor.name, 'retrieveVersionById');
    }

    async create(data, options, callback) {
        throw new NotImplementedError(this.constructor.name, 'create');
    }

    async retrieveAll(options) {
        // require here to avoid circular dependency
        const relationshipsService = require('./relationships-service');

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
        let documents = await AttackObject.aggregate(aggregation);

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

        // Add identities
        if (!this.identitiesService) {
            this.identitiesService = require('./identities-service');
        }
        await this.identitiesService.addCreatedByAndModifiedByIdentitiesToAll(paginatedDocuments);

        // Prepare the return value
        if (options.includePagination) {
            const returnValue = {
                pagination: {
                    total: documents.length,
                    offset: options.offset,
                    limit: options.limit
                },
                data: paginatedDocuments
            };
            return returnValue;
        }
        else {
            return paginatedDocuments;
        }
    };

    async retrieveVersionById(stixId, modified) {
        // Retrieve the version of the attack object with the matching stixId and modified date

        // require here to avoid circular dependency
        const relationshipsService = require('./relationships-service');
        const retrieveRelationshipsVersionById = util.promisify(relationshipsService.retrieveVersionById);

        if (!stixId) {
            throw new MissingParameterError('stixId');
        }

        if (!modified) {
            throw new MissingParameterError('modified');
        }

        let attackObject;
        if (stixId.startsWith(relationshipPrefix)) {
            attackObject = await retrieveRelationshipsVersionById(stixId, modified);
        }
        else {
            try {
                attackObject = await AttackObject.findOne({ 'stix.id': stixId, 'stix.modified': modified });
            }
            catch(err) {
                if (err.name === 'CastError') {
                    throw new BadlyFormattedParameterError('stixId');
                } else {
                    throw err;
                }
            }
        }

        // Note: attackObject is null if not found
        if (!identitiesService) {
            identitiesService = require('./identities-service');
        }
        await identitiesService.addCreatedByAndModifiedByIdentities(attackObject);
        return attackObject;
    };

    // Record that this object is part of a collection
    async insertCollection(stixId, modified, collectionId, collectionModified) {
        let attackObject;
        if (stixId.startsWith(relationshipPrefix)) {
            attackObject = await Relationship.findOne({ 'stix.id': stixId, 'stix.modified': modified });
        }
        else {
            attackObject = await AttackObject.findOne({ 'stix.id': stixId, 'stix.modified': modified });
        }

        if (attackObject) {
            // Create the collection reference
            const collection = {
                collection_ref: collectionId,
                collection_modified: collectionModified
            };

            // Make sure the exports array exists and add the collection reference
            if (!attackObject.workspace.collections) {
                attackObject.workspace.collections = [];
            }

            // Check to see if the collection is already added
            // (collection with same id and version should only be created--and therefore objects added--one time)
            const duplicateCollection = attackObject.workspace.collections.find(
                item => item.collection_ref === collection.collection_ref && item.collection_modified === collection.collection_modified);
            if (duplicateCollection) {
                throw new Error(this.errors.duplicateCollection);
            }

            attackObject.workspace.collections.push(collection);

            await attackObject.save();
        }
        else {
            throw new Error(this.errors.notFound);
        }
    };

    async setDefaultMarkingDefinitions(attackObject) {
        // Add any default marking definitions that are not in the current list for this object
        const defaultMarkingDefinitions = await systemConfigurationService.retrieveDefaultMarkingDefinitions({ refOnly: true });
        if (attackObject.stix.object_marking_refs) {
            attackObject.stix.object_marking_refs = attackObject.stix.object_marking_refs.concat(defaultMarkingDefinitions.filter(e => !attackObject.stix.object_marking_refs.includes(e)));
        }
        else {
            attackObject.stix.object_marking_refs = defaultMarkingDefinitions;
        }
    }
}
module.exports = new AttackObjectsService(null, AttackObject);