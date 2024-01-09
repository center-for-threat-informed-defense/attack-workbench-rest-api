'use strict';

const dataSourceRepository = require('../repository/data-source-repository');
const identitiesService = require('./identities-service');
const dataComponentsService = require('./data-components-service');
const BaseService = require('./_base.service');
const { MissingParameterError, BadlyFormattedParameterError, InvalidQueryStringParameterError } = require('../exceptions');


class DataSourcesService extends BaseService {

    errors = {
        missingParameter: 'Missing required parameter',
        badlyFormattedParameter: 'Badly formatted parameter',
        duplicateId: 'Duplicate id',
        notFound: 'Document not found',
        invalidQueryStringParameter: 'Invalid query string parameter'
    }


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

    async retrieveById(stixId, options, callback) {
        try {
            // versions=all    Retrieve all versions of the data source with the stixId
            // versions=latest Retrieve the data source with the latest modified date for this stixId
    
            if (!stixId) {
                if (callback) {
                    return callback(new Error(this.errors.missingParameter));
                }
                throw new MissingParameterError;
            }
    
            if (options.versions === 'all') {
                const dataSources = await this.repository.model.find({ 'stix.id': stixId }).lean().exec();
                await this.addExtraDataToAll(dataSources, options.retrieveDataComponents);
                if (callback) {
                    return callback(null, dataSources);
                }
                return dataSources;
            } else if (options.versions === 'latest') {
                const dataSource = await this.repository.model.findOne({ 'stix.id': stixId }).sort('-stix.modified').lean().exec();
    
                // Note: document is null if not found
                if (dataSource) {
                    await this.addExtraData(dataSource, options.retrieveDataComponents);
                    if (callback) {
                        return callback(null, [dataSource]);
                    }
                    return [dataSource];
                } else {
                    if (callback) {
                        return callback(null, []);
                    }
                    return [];
                }
            } else {
                if (callback) {
                    return callback(new Error(this.errors.invalidQueryStringParameter));
                }
                throw new InvalidQueryStringParameterError;
            }
        } catch (err) {
            if (err.name === 'CastError') {
                if (callback) {
                    return callback(new Error(this.errors.badlyFormattedParameter));
                }
                throw new BadlyFormattedParameterError;
            } else {
                if (callback) {
                    return callback(err);
                }
                throw err;
            }
        }
    }
    
    
    async retrieveVersionById(stixId, modified, options, callback) {
        try {
            // Retrieve the version of the data source with the matching stixId and modified date
    
            if (!stixId) {
                if (callback) {
                    return callback(new Error(this.errors.missingParameter));
                }
                throw new MissingParameterError;
            }
    
            if (!modified) {
                if (callback) {
                    return callback(new Error(this.errors.missingParameter));
                }
                throw new MissingParameterError;
            }
    
            const dataSource = await this.repository.model.findOne({ 'stix.id': stixId, 'stix.modified': modified }).exec();
    
            // Note: document is null if not found
            if (dataSource) {
                await this.addExtraData(dataSource, options.retrieveDataComponents);
                if (callback) {
                    return callback(null, dataSource);
                }
                return dataSource;
            } else {
                if (callback) {
                    return callback(null, null);
                }
                return null;
            }
        } catch (err) {
            if (err.name === 'CastError') {
                if (callback) {
                    return callback(new Error(this.errors.badlyFormattedParameter));
                }
                throw new BadlyFormattedParameterError;
            } else {
                if (callback) {
                    return callback(err);
                }
                throw err;
            }
        }
    }
    

}

module.exports = new DataSourcesService('x-mitre-data-source', dataSourceRepository);