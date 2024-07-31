'use strict';

const BaseService = require('./_base.service');
const recentActivityRepository = require('../repository/recent-activity-repository');
const identitiesService = require('./identities-service');
const { MissingParameterError, BadlyFormattedParameterError, NotFoundError, InvalidQueryStringParameterError } = require('../exceptions');

class RecentActivityService extends BaseService {

    async retrieveAll(options) {
        const documents = await this.repository.retrieveAll(options);

        // Sort by most recent
        documents.sort((a, b) => b.stix.modified - a.stix.modified);

        // Process source and target objects
        this._processSourceTargetObjects(documents);

        // Apply pagination
        const paginatedDocuments = this._applyPagination(documents, options);

        // Add identities
        await identitiesService.addCreatedByAndModifiedByIdentitiesToAll(paginatedDocuments);

        // Prepare the return value
        if (options.includePagination) {
            return {
                pagination: {
                    total: allDocuments.length,
                    offset: options.offset,
                    limit: options.limit
                },
                data: paginatedDocuments
            };
        } else {
            return paginatedDocuments;
        }
    }

    _processSourceTargetObjects(documents) {
        for (const document of documents) {
            if (Array.isArray(document.source_objects)) {
                document.source_object = document.source_objects.length > 0 ? document.source_objects[0] : undefined;
                delete document.source_objects;
            }

            if (Array.isArray(document.target_objects)) {
                document.target_object = document.target_objects.length > 0 ? document.target_objects[0] : undefined;
                delete document.target_objects;
            }
        }
    }

    _applyPagination(documents, options) {
        const offset = options.offset ?? 0;
        const limit = options.limit ?? 0;

        if (limit > 0) {
            return documents.slice(offset, offset + limit);
        } else {
            return documents.slice(offset);
        }
    }
}

module.exports = new RecentActivityService('recent-activity', recentActivityRepository);