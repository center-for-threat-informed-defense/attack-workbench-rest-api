'use strict';

const dataSourceRepository = require('../repository/data-source-repository');
const identitiesService = require('./identities-service');
const dataComponentsService = require('./data-components-service');
const {lastUpdatedByQueryHelper} = require('../lib/request-parameter-helper');
const BaseService = require('./_base.service');

const errors = {
    missingParameter: 'Missing required parameter',
    badlyFormattedParameter: 'Badly formatted parameter',
    duplicateId: 'Duplicate id',
    notFound: 'Document not found',
    invalidQueryStringParameter: 'Invalid query string parameter'
};
exports.errors = errors;

class DataSourcesService extends BaseService {

    async addExtraData(dataSource, retrieveDataComponents) {
        await identitiesService.addCreatedByAndModifiedByIdentities(dataSource);
        if (retrieveDataComponents) {
            await this.addDataComponents(dataSource);
        }
    }

    async addExtraDataToAll(dataSources, retrieveDataComponents) {
        for (const dataSource of dataSources) {
            // eslint-disable-next-line no-await-in-loop
            await this.addExtraData(dataSource, retrieveDataComponents);
        }
    }

    async addDataComponents(dataSource) {
        // We have to work with the latest version of all data components to avoid mishandling a situation
        // where an earlier version of a data component may reference a data source, but the latest
        // version doesn't.

        // Retrieve the latest version of all data components
        const allDataComponents = await dataComponentsService.retrieveAllAsync({ includeDeprecated: true, includeRevoked: true });

        // Add the data components that reference the data source
        dataSource.dataComponents = allDataComponents.filter(dataComponent => dataComponent.stix.x_mitre_data_source_ref === dataSource.stix.id);
    }

}

module.exports = new DataSourcesService('x-mitre-data-source', dataSourceRepository);