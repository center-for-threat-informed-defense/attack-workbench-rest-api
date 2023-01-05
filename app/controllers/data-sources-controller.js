'use strict';

const dataSourcesService = require('../services/data-sources-service');
const logger = require('../lib/logger');

exports.retrieveAll = function(req, res) {
    const options = {
        offset: req.query.offset || 0,
        limit: req.query.limit || 0,
        domain: req.query.domain,
        platform: req.query.platform,
        state: req.query.state,
        includeRevoked: req.query.includeRevoked,
        includeDeprecated: req.query.includeDeprecated,
        search: req.query.search,
        includePagination: req.query.includePagination
    }

    dataSourcesService.retrieveAll(options, function(err, results) {
        if (err) {
            logger.error('Failed with error: ' + err);
            return res.status(500).send('Unable to get data sources. Server error.');
        }
        else {
            if (options.includePagination) {
                logger.debug(`Success: Retrieved ${ results.data.length } of ${ results.pagination.total } total data source(s)`);
            }
            else {
                logger.debug(`Success: Retrieved ${ results.length } data source(s)`);
            }
            return res.status(200).send(results);
        }
    });
};

exports.retrieveById = function(req, res) {
    const options = {
        versions: req.query.versions || 'latest',
        retrieveDataComponents: req.query.retrieveDataComponents
    }

    dataSourcesService.retrieveById(req.params.stixId, options, function (err, dataSources) {
        if (err) {
            if (err.message === dataSourcesService.errors.badlyFormattedParameter) {
                logger.warn('Badly formatted stix id: ' + req.params.stixId);
                return res.status(400).send('Stix id is badly formatted.');
            }
            else if (err.message === dataSourcesService.errors.invalidQueryStringParameter) {
                logger.warn('Invalid query string: versions=' + req.query.versions);
                return res.status(400).send('Query string parameter versions is invalid.');
            }
            else {
                logger.error('Failed with error: ' + err);
                return res.status(500).send('Unable to get data sources. Server error.');
            }
        }
        else {
            if (dataSources.length === 0) {
                return res.status(404).send('Data source not found.');
            }
            else {
                logger.debug(`Success: Retrieved ${ dataSources.length } data source(s) with id ${ req.params.stixId }`);
                return res.status(200).send(dataSources);
            }
        }
    });
};

exports.retrieveVersionById = function(req, res) {
    const options = {
        retrieveDataComponents: req.query.retrieveDataComponents
    }

    dataSourcesService.retrieveVersionById(req.params.stixId, req.params.modified, options, function (err, dataSource) {
        if (err) {
            if (err.message === dataSourcesService.errors.badlyFormattedParameter) {
                logger.warn('Badly formatted stix id: ' + req.params.stixId);
                return res.status(400).send('Stix id is badly formatted.');
            }
            else {
                logger.error('Failed with error: ' + err);
                return res.status(500).send('Unable to get data source. Server error.');
            }
        } else {
            if (!dataSource) {
                return res.status(404).send('Data source not found.');
            }
            else {
                logger.debug(`Success: Retrieved data source with id ${dataSource.id}`);
                return res.status(200).send(dataSource);
            }
        }
    });
};

exports.create = async function(req, res) {
    // Get the data from the request
    const dataSourceData = req.body;

    // Create the data source
    try {
        const options = {
            import: false,
            userAccountId: req.user?.userAccountId
        };
        const dataSource = await dataSourcesService.create(dataSourceData, options);
        logger.debug("Success: Created data source with id " + dataSource.stix.id);
        return res.status(201).send(dataSource);
    }
    catch(err) {
        if (err.message === dataSourcesService.errors.duplicateId) {
            logger.warn("Duplicate stix.id and stix.modified");
            return res.status(409).send('Unable to create data source. Duplicate stix.id and stix.modified properties.');
        }
        else {
            logger.error("Failed with error: " + err);
            return res.status(500).send("Unable to create data source. Server error.");
        }
    }
};

exports.updateFull = function(req, res) {
    // Get the data from the request
    const dataSourceData = req.body;

    // Create the data source
    dataSourcesService.updateFull(req.params.stixId, req.params.modified, dataSourceData, function(err, dataSource) {
        if (err) {
            logger.error("Failed with error: " + err);
            return res.status(500).send("Unable to update data source. Server error.");
        }
        else {
            if (!dataSource) {
                return res.status(404).send('Data source not found.');
            } else {
                logger.debug("Success: Updated data source with id " + dataSource.stix.id);
                return res.status(200).send(dataSource);
            }
        }
    });
};

exports.deleteVersionById = function(req, res) {
    dataSourcesService.deleteVersionById(req.params.stixId, req.params.modified, function (err, dataSource) {
        if (err) {
            logger.error('Delete data source failed. ' + err);
            return res.status(500).send('Unable to delete data source. Server error.');
        }
        else {
            if (!dataSource) {
                return res.status(404).send('Data source not found.');
            } else {
                logger.debug("Success: Deleted data source with id " + dataSource.stix.id);
                return res.status(204).end();
            }
        }
    });
};

exports.deleteById = function(req, res) {
    dataSourcesService.deleteById(req.params.stixId, function (err, dataSources) {
        if (err) {
            logger.error('Delete data source failed. ' + err);
            return res.status(500).send('Unable to delete data source. Server error.');
        }
        else {
            if (dataSources.deletedCount === 0) {
                return res.status(404).send('Data Sources not found.');
            }
            else {
                logger.debug(`Success: Deleted data source with id ${ req.params.stixId }`);
                return res.status(204).end();
            }
        }
    });
};
