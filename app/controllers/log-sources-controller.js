'use strict';

const logSourcesService = require('../services/log-sources-service');
const logger = require('../lib/logger');
const {
  DuplicateIdError,
  BadlyFormattedParameterError,
  InvalidQueryStringParameterError,
} = require('../exceptions');

exports.retrieveAll = async function (req, res) {
  const options = {
    offset: req.query.offset || 0,
    limit: req.query.limit || 0,
    domain: req.query.domain,
    state: req.query.state,
    includeRevoked: req.query.includeRevoked,
    includeDeprecated: req.query.includeDeprecated,
    search: req.query.search,
    lastUpdatedBy: req.query.lastUpdatedBy,
    includePagination: req.query.includePagination,
  };

  try {
    const results = await logSourcesService.retrieveAll(options);
    if (options.includePagination) {
      logger.debug(
        `Success: Retrieved ${results.data.length} of ${results.pagination.total} total log source(s)`,
      );
    } else {
      logger.debug(`Success: Retrieved ${results.length} log source(s)`);
    }
    return res.status(200).send(results);
  } catch (err) {
    logger.error('Failed with error: ' + err);
    return res.status(500).send('Unable to get log sources. Server error.');
  }
};

exports.retrieveById = async function (req, res) {
  const options = {
    versions: req.query.versions || 'latest',
  };

  try {
    const logSources = await logSourcesService.retrieveById(req.params.stixId, options);
    if (logSources.length === 0) {
      return res.status(404).send('Log source not found.');
    } else {
      logger.debug(
        `Success: Retrieved ${logSources.length} log source(s) with id ${req.params.stixId}`,
      );
      return res.status(200).send(logSources);
    }
  } catch (err) {
    if (err instanceof BadlyFormattedParameterError) {
      logger.warn('Badly formatted stix id: ' + req.params.stixId);
      return res.status(400).send('Stix id is badly formatted.');
    } else if (err instanceof InvalidQueryStringParameterError) {
      logger.warn('Invalid query string: versions=' + req.query.versions);
      return res.status(400).send('Query string parameter versions is invalid.');
    } else {
      logger.error('Failed with error: ' + err);
      return res.status(500).send('Unable to get log sources. Server error.');
    }
  }
};

exports.retrieveVersionById = async function (req, res) {
  try {
    const logSource = await logSourcesService.retrieveVersionById(
      req.params.stixId,
      req.params.modified,
    );
    if (!logSource) {
      return res.status(404).send('Log source not found.');
    } else {
      logger.debug(`Success: Retrieved log source with id ${logSource.id}`);
      return res.status(200).send(logSource);
    }
  } catch (err) {
    if (err instanceof BadlyFormattedParameterError) {
      logger.warn('Badly formatted stix id: ' + req.params.stixId);
      return res.status(400).send('Stix id is badly formatted.');
    } else {
      logger.error('Failed with error: ' + err);
      return res.status(500).send('Unable to get log source. Server error.');
    }
  }
};

exports.create = async function (req, res) {
  // Get the data from the request
  const logSourceData = req.body;
  const options = {
    import: false,
    userAccountId: req.user?.userAccountId,
  };

  // Create the log source
  try {
    const logSource = await logSourcesService.create(logSourceData, options);
    logger.debug('Success: Created log source with id ' + logSource.stix.id);
    return res.status(201).send(logSource);
  } catch (err) {
    if (err instanceof DuplicateIdError) {
      logger.warn('Duplicate stix.id and stix.modified');
      return res
        .status(409)
        .send('Unable to create log source. Duplicate stix.id and stix.modified properties.');
    } else {
      logger.error('Failed with error: ' + err);
      return res.status(500).send('Unable to create log source. Server error.');
    }
  }
};

exports.updateFull = async function (req, res) {
  // Get the data from the request
  const logSourceData = req.body;

  // Create the log source
  try {
    const logSource = await logSourcesService.updateFull(
      req.params.stixId,
      req.params.modified,
      logSourceData,
    );
    if (!logSource) {
      return res.status(404).send('Log source not found.');
    } else {
      logger.debug('Success: Updated log source with id ' + logSource.stix.id);
      return res.status(200).send(logSource);
    }
  } catch (err) {
    logger.error('Failed with error: ' + err);
    return res.status(500).send('Unable to update log source. Server error.');
  }
};

exports.deleteVersionById = async function (req, res) {
  try {
    const logSource = await logSourcesService.deleteVersionById(
      req.params.stixId,
      req.params.modified,
    );
    if (!logSource) {
      return res.status(404).send('Log source not found.');
    } else {
      logger.debug('Success: Deleted log source with id ' + logSource.stix.id);
      return res.status(204).end();
    }
  } catch (err) {
    logger.error('Delete log source failed. ' + err);
    return res.status(500).send('Unable to delete log source. Server error.');
  }
};

exports.deleteById = async function (req, res) {
  try {
    const logSources = await logSourcesService.deleteById(req.params.stixId);
    if (logSources.deletedCount === 0) {
      return res.status(404).send('Log Sources not found.');
    } else {
      logger.debug(`Success: Deleted log source with id ${req.params.stixId}`);
      return res.status(204).end();
    }
  } catch (err) {
    logger.error('Delete log source failed. ' + err);
    return res.status(500).send('Unable to delete log source. Server error.');
  }
};
