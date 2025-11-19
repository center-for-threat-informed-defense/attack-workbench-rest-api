'use strict';

const dataSourcesRepository = require('../../repository/data-sources-repository');
const identitiesService = require('./identities-service');
const dataComponentsService = require('./data-components-service');
const { BaseService } = require('../meta-classes');
const { DataSource: DataSourceType } = require('../../lib/types');
const {
  MissingParameterError,
  BadlyFormattedParameterError,
  InvalidQueryStringParameterError,
} = require('../../exceptions');

class DataSourcesService extends BaseService {
  errors = {
    missingParameter: 'Missing required parameter',
    badlyFormattedParameter: 'Badly formatted parameter',
    duplicateId: 'Duplicate id',
    notFound: 'Document not found',
    invalidQueryStringParameter: 'Invalid query string parameter',
  };

  static async addExtraData(dataSource, retrieveDataComponents) {
    await identitiesService.addCreatedByAndModifiedByIdentities(dataSource);
    if (retrieveDataComponents) {
      await DataSourcesService.addDataComponents(dataSource);
    }
  }

  static async addExtraDataToAll(dataSources, retrieveDataComponents) {
    for (const dataSource of dataSources) {
      await DataSourcesService.addExtraData(dataSource, retrieveDataComponents);
    }
  }

  static async addDataComponents(dataSource) {
    // We have to work with the latest version of all data components to avoid mishandling a situation
    // where an earlier version of a data component may reference a data source, but the latest
    // version doesn't.

    // Retrieve the latest version of all data components
    const allDataComponents = await dataComponentsService.retrieveAll({
      includeDeprecated: true,
      includeRevoked: true,
    });

    console.log('DEBUG: allDataComponents type:', typeof allDataComponents);
    console.log('DEBUG: allDataComponents is array:', Array.isArray(allDataComponents));
    console.log('DEBUG: allDataComponents:', JSON.stringify(allDataComponents, null, 2));

    // Add the data components that reference the data source
    dataSource.dataComponents = allDataComponents.filter(
      (dataComponent) => dataComponent.stix.x_mitre_data_source_ref === dataSource.stix.id,
    );
  }

  async retrieveById(stixId, options) {
    try {
      // versions=all    Retrieve all versions of the data source with the stixId
      // versions=latest Retrieve the data source with the latest modified date for this stixId

      if (!stixId) {
        throw new MissingParameterError('stixId');
      }

      if (options.versions === 'all') {
        const dataSources = await this.repository.retrieveAllById(stixId);
        await DataSourcesService.addExtraDataToAll(dataSources, options.retrieveDataComponents);
        return dataSources;
      } else if (options.versions === 'latest') {
        const dataSource = await this.repository.retrieveLatestByStixId(stixId);

        // Note: document is null if not found
        if (dataSource) {
          await DataSourcesService.addExtraData(dataSource, options.retrieveDataComponents);
          return [dataSource];
        } else {
          return [];
        }
      } else {
        throw new InvalidQueryStringParameterError();
      }
    } catch (err) {
      if (err.name === 'CastError') {
        throw new BadlyFormattedParameterError();
      } else {
        throw err;
      }
    }
  }

  async retrieveVersionById(stixId, modified, options) {
    try {
      // Retrieve the version of the data source with the matching stixId and modified date

      if (!stixId) {
        throw new MissingParameterError('stixId');
      }

      if (!modified) {
        throw new MissingParameterError('modified');
      }

      const dataSource = await this.repository.retrieveOneByVersion(stixId, modified);

      // Note: document is null if not found
      if (dataSource) {
        await DataSourcesService.addExtraData(dataSource, options.retrieveDataComponents);
        return dataSource;
      } else {
        return null;
      }
    } catch (err) {
      if (err.name === 'CastError') {
        throw new BadlyFormattedParameterError();
      } else {
        throw err;
      }
    }
  }
}

module.exports = new DataSourcesService(DataSourceType, dataSourcesRepository);
