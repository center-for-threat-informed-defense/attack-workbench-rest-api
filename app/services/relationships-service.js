'use strict';

//** core dependencies **/
const BaseService = require('./_base.service');
const relationshipsRepository = require('../repository/relationships-repository');

// ** service dependencies **/
const identitiesService = require('./identities-service');
const systemConfigService = require('./system-configuration-service');
const config = require('../config/config');

// ** misc **/
const uuid = require('uuid');
const { InvalidTypeError } = require('../exceptions');

class RelationshipsService extends BaseService {

    static objectTypeMap = new Map([
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

    async retrieveAll(options) {
        // First get results from repository
        const results = await this.repository.retrieveAll(options);

        // Apply source/target type filtering if needed
        if (options.sourceType || options.targetType) {
            const [{ documents, totalCount }] = results;
            let filteredDocs = documents;

            // Filter by source type if specified
            if (options.sourceType) {
                filteredDocs = filteredDocs.filter(document => {
                    if (!document.source_objects?.length) {
                        return false;
                    }
                    // Sort by modified date to get the latest version
                    document.source_objects.sort((a, b) => b.stix.modified - a.stix.modified);
                    return RelationshipsService.objectTypeMap.get(document.source_objects[0].stix.type) === options.sourceType;
                });
            }

            // Filter by target type if specified
            if (options.targetType) {
                filteredDocs = filteredDocs.filter(document => {
                    if (!document.target_objects?.length) {
                        return false;
                    }
                    // Sort by modified date to get the latest version
                    document.target_objects.sort((a, b) => b.stix.modified - a.stix.modified);
                    return RelationshipsService.objectTypeMap.get(document.target_objects[0].stix.type) === options.targetType;
                });
            }

            // Update results with filtered documents and recalculate total count
            results[0].documents = filteredDocs;
            if (totalCount?.length > 0) {
                results[0].totalCount[0].totalCount = filteredDocs.length;
            }
        }

        // Add identity information if requested
        if (options.includeIdentities) {
            await identitiesService.addCreatedByAndModifiedByIdentitiesToAll(results[0].documents);
        }

        // Format and return results
        return RelationshipsService._formatResults(results, options);
    }

    static _formatResults(results, options) {
        const [{ documents, totalCount }] = results;

        // Move source/target objects to single properties
        for (const document of documents) {
            if (Array.isArray(document.source_objects)) {
                document.source_object = document.source_objects[0];
                delete document.source_objects;
            }
            if (Array.isArray(document.target_objects)) {
                document.target_object = document.target_objects[0];
                delete document.target_objects;
            }
        }

        // Return with or without pagination wrapper
        return options.includePagination ? {
            pagination: {
                total: totalCount[0]?.totalCount || 0,
                offset: options.offset,
                limit: options.limit
            },
            data: documents
        } : documents;
    }

    async create(data, options = {}) {
        if (data?.stix?.type !== 'relationship') {
            throw new InvalidTypeError();
        }

        if (!options.import) {
            await this._enrichMetadata(data, options);
        }

        return this.repository.save(data);
    }

    async _enrichMetadata(data, options) {
        data.stix.x_mitre_attack_spec_version = data.stix.x_mitre_attack_spec_version ?? config.app.attackSpecVersion;
    
        if (options.userAccountId) {
            data.workspace.workflow.created_by_user_account = options.userAccountId;
        }
    
        // Set the default marking definitions
        await systemConfigService.setDefaultMarkingDefinitionsForObject(data);
    
        const organizationIdentityRef = await this.systemConfigService.retrieveOrganizationIdentityRef();
        
        // Check for existing object
        let existingObject;
        if (data.stix.id) {
            existingObject = await this.repository.retrieveOneById(data.stix.id);
        }
    
        if (existingObject) {
            // New version - only set modified_by_ref
            data.stix.x_mitre_modified_by_ref = organizationIdentityRef;
        } else {
            // New object - set both refs and generate id if needed
            data.stix.id = data.stix.id || `relationship--${uuid.v4()}`;
            data.stix.created_by_ref = organizationIdentityRef;
            data.stix.x_mitre_modified_by_ref = organizationIdentityRef;
        }
    }
}

module.exports = new RelationshipsService('relationship', relationshipsRepository);
