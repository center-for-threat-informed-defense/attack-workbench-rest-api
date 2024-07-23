'use strict'

import BaseRepository from './_base.repository';
import RelationshipModel from '../models/relationship-model';
import { lastUpdatedByQueryHelper } from '../lib/request-parameter-helper';

import { BadlyFormattedParameterError, DatabaseError, DuplicateIdError } from '../exceptions';


class RelationshipsRepository extends BaseRepository {

    async retrieveAll(options) {
        const query = this._buildQuery(options);
        const aggregation = this._buildAggregation(options, query);

        if (options.lookupRefs) {
            this._addLookupStages(aggregation);
        }
        try {
            const results = await this.model.aggregate(aggregation);
            return this._applyFilters(results, options);
        } catch (err) {
            throw new DatabaseError(err);
        }
    }

    _buildQuery(options) {
        const query = {};
        if (!options.includeRevoked) {
            query['stix.revoked'] = { $in: [null, false] };
        }
        if (!options.includeDeprecated) {
            query['stix.x_mitre_deprecated'] = { $in: [null, false] };
        }
        if (typeof options.state !== 'undefined') {
            query['workspace.workflow.state'] = Array.isArray(options.state) ? { $in: options.state } : options.state;
        }
        if (options.sourceRef) {
            query['stix.source_ref'] = options.sourceRef;
        }
        if (options.targetRef) {
            query['stix.target_ref'] = options.targetRef;
        }
        if (options.sourceOrTargetRef) {
            query.$or = [{ 'stix.source_ref': options.sourceOrTargetRef }, { 'stix.target_ref': options.sourceOrTargetRef }];
        }
        if (options.relationshipType) {
            query['stix.relationship_type'] = options.relationshipType;
        }
        if (options.lastUpdatedBy) {
            query['workspace.workflow.created_by_user_account'] = lastUpdatedByQueryHelper(options.lastUpdatedBy);
        }
        return query;
    }

    _buildAggregation(options, query) {
        const aggregation = [];
        if (options.versions === 'latest') {
            aggregation.push(
                { $sort: { 'stix.id': 1, 'stix.modified': -1 } },
                { $group: { _id: '$stix.id', document: { $first: '$$ROOT' } } },
                { $replaceRoot: { newRoot: '$document' } }
            );
        }
        aggregation.push(
            { $sort: { 'stix.id': 1 } },
            { $match: query }
        );
        return aggregation;
    }

    _addLookupStages(aggregation) {
        aggregation.push(
            {
                $lookup: {
                    from: 'attackObjects',
                    localField: 'stix.source_ref',
                    foreignField: 'stix.id',
                    as: 'source_objects'
                }
            },
            {
                $lookup: {
                    from: 'attackObjects',
                    localField: 'stix.target_ref',
                    foreignField: 'stix.id',
                    as: 'target_objects'
                }
            }
        );
    }

    _applyFilters(results, options) {
        const objectTypeMap = new Map([
            ['malware', 'software'],
            ['tool', 'software'],
            ['attack-pattern', 'technique'],
            ['intrusion-set', 'group'],
            ['campaign', 'campaign'],
            ['x-mitre-asset', 'asset'],
            ['course-of-action', 'mitigation'],
            ['x-mitre-tactic', 'tactic'],
            ['x-mitre-matrix', 'matrix'],
            ['x-mitre-data-component', 'data-component']
        ]);

        if (options.sourceType) {
            results = results.filter(doc => {
                if (doc.source_objects.length === 0) return false;
                doc.source_objects.sort((a, b) => b.stix.modified - a.stix.modified);
                return objectTypeMap.get(doc.source_objects[0].stix.type) === options.sourceType;
            });
        }

        if (options.targetType) {
            results = results.filter(doc => {
                if (doc.target_objects.length === 0) return false;
                doc.target_objects.sort((a, b) => b.stix.modified - a.stix.modified);
                return objectTypeMap.get(doc.target_objects[0].stix.type) === options.targetType;
            });
        }

        results.forEach(doc => {
            if (Array.isArray(doc.source_objects)) {
                doc.source_object = doc.source_objects[0] || undefined;
                delete doc.source_objects;
            }
            if (Array.isArray(doc.target_objects)) {
                doc.target_object = doc.target_objects[0] || undefined;
                delete doc.target_objects;
            }
        });

        return results;
    }
}

module.exports = new RelationshipsRepository(RelationshipModel);