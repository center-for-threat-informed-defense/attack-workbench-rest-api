'use strict';

const dataComponentsService = require('../services/data-components-service');
const logger = require('../lib/logger');

exports.retrieveAll = function(req, res) {
    const options = {
        offset: req.query.offset || 0,
        limit: req.query.limit || 0,
        state: req.query.state,
        includeRevoked: req.query.includeRevoked,
        includeDeprecated: req.query.includeDeprecated,
        search: req.query.search,
        includePagination: req.query.includePagination
    }

    dataComponentsService.retrieveAll(options, function(err, results) {
        if (err) {
            logger.error('Failed with error: ' + err);
            return res.status(500).send('Unable to get data components. Server error.');
        }
        else {
            if (options.includePagination) {
                logger.debug(`Success: Retrieved ${ results.data.length } of ${ results.pagination.total } total data component(s)`);
            }
            else {
                logger.debug(`Success: Retrieved ${ results.length } data component(s)`);
            }
            return res.status(200).send(results);
        }
    });
};

exports.retrieveById = function(req, res) {
    const options = {
        versions: req.query.versions || 'latest'
    }

    dataComponentsService.retrieveById(req.params.stixId, options, function (err, dataComponents) {
        if (err) {
            if (err.message === dataComponentsService.errors.badlyFormattedParameter) {
                logger.warn('Badly formatted stix id: ' + req.params.stixId);
                return res.status(400).send('Stix id is badly formatted.');
            }
            else if (err.message === dataComponentsService.errors.invalidQueryStringParameter) {
                logger.warn('Invalid query string: versions=' + req.query.versions);
                return res.status(400).send('Query string parameter versions is invalid.');
            }
            else {
                logger.error('Failed with error: ' + err);
                return res.status(500).send('Unable to get data component. Server error.');
            }
        }
        else {
            if (dataComponents.length === 0) {
                return res.status(404).send('Data component not found.');
            }
            else {
                logger.debug(`Success: Retrieved ${ dataComponents.length } data component(s) with id ${ req.params.stixId }`);
                return res.status(200).send(dataComponents);
            }
        }
    });
};

exports.retrieveVersionById = function(req, res) {
    dataComponentsService.retrieveVersionById(req.params.stixId, req.params.modified, function (err, dataComponent) {
        if (err) {
            if (err.message === dataComponentsService.errors.badlyFormattedParameter) {
                logger.warn('Badly formatted stix id: ' + req.params.stixId);
                return res.status(400).send('Stix id is badly formatted.');
            }
            else {
                logger.error('Failed with error: ' + err);
                return res.status(500).send('Unable to get data component. Server error.');
            }
        } else {
            if (!dataComponent) {
                return res.status(404).send('Data component not found.');
            }
            else {
                logger.debug(`Success: Retrieved data component with id ${dataComponent.id}`);
                return res.status(200).send(dataComponent);
            }
        }
    });
};

exports.create = async function(req, res) {
    // Get the data from the request
    const dataComponentData = req.body;

    // Create the data component
    try {
        const options = {
            import: false,
            userAccountId: req.user?.userAccountId
        };
        const dataComponent = await dataComponentsService.create(dataComponentData, options);
        logger.debug("Success: Created data component with id " + dataComponent.stix.id);
        return res.status(201).send(dataComponent);
    }
    catch(err) {
        if (err.message === dataComponentsService.errors.duplicateId) {
            logger.warn("Duplicate stix.id and stix.modified");
            return res.status(409).send('Unable to create data component. Duplicate stix.id and stix.modified properties.');
        }
        else {
            logger.error("Failed with error: " + err);
            return res.status(500).send("Unable to create data component. Server error.");
        }
    }
};

exports.updateFull = function(req, res) {
    // Get the data from the request
    const dataComponentData = req.body;

    // Create the data component
    dataComponentsService.updateFull(req.params.stixId, req.params.modified, dataComponentData, function(err, dataComponent) {
        if (err) {
            logger.error("Failed with error: " + err);
            return res.status(500).send("Unable to update data component. Server error.");
        }
        else {
            if (!dataComponent) {
                return res.status(404).send('Data component not found.');
            } else {
                logger.debug("Success: Updated data component with id " + dataComponent.stix.id);
                return res.status(200).send(dataComponent);
            }
        }
    });
};

exports.delete = function(req, res) {
    dataComponentsService.delete(req.params.stixId, req.params.modified, function (err, dataComponent) {
        if (err) {
            logger.error('Delete data component failed. ' + err);
            return res.status(500).send('Unable to delete data component. Server error.');
        }
        else {
            if (!dataComponent) {
                return res.status(404).send('Data component not found.');
            } else {
                logger.debug("Success: Deleted data component with id " + dataComponent.stix.id);
                return res.status(204).end();
            }
        }
    });
};

exports.deleteAllVersion = function(req, res) {
    dataComponentsService.deleteAllVersion(req.params.stixId, function (err, dataComponents) {
        if (err) {
            logger.error('Delete data component failed. ' + err);
            return res.status(500).send('Unable to delete data component. Server error.');
        }
        else {
            if (dataComponents.deletedCount === 0) {
                return res.status(404).send('Data Component not found.');
            }
            else {
                logger.debug(`Success: Deleted data component with id ${ req.params.stixId }`);
                return res.status(204).end();
            }
        }
    });
};
