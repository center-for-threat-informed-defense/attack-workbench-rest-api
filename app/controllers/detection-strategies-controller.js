'use strict';

const detectionStrategiesService = require('../services/stix/detection-strategies-service');
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
    const results = await detectionStrategiesService.retrieveAll(options);
    if (options.includePagination) {
      logger.debug(
        `Success: Retrieved ${results.data.length} of ${results.pagination.total} total detection strategies`,
      );
    } else {
      logger.debug(`Success: Retrieved ${results.length} detection strategies`);
    }
    return res.status(200).send(results);
  } catch (err) {
    logger.error('Failed with error: ' + err);
    return res.status(500).send('Unable to get detection strategies. Server error.');
  }
};

exports.retrieveById = async function (req, res) {
  const options = {
    versions: req.query.versions || 'latest',
  };

  try {
    const detectionStrategies = await detectionStrategiesService.retrieveById(
      req.params.stixId,
      options,
    );
    if (detectionStrategies.length === 0) {
      return res.status(404).send('Detection strategy not found.');
    } else {
      logger.debug(
        `Success: Retrieved ${detectionStrategies.length} detection strategies with id ${req.params.stixId}`,
      );
      return res.status(200).send(detectionStrategies);
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
      return res.status(500).send('Unable to get detection strategies. Server error.');
    }
  }
};

exports.retrieveVersionById = async function (req, res) {
  try {
    const detectionStrategy = await detectionStrategiesService.retrieveVersionById(
      req.params.stixId,
      req.params.modified,
    );
    if (!detectionStrategy) {
      return res.status(404).send('Detection strategy not found.');
    } else {
      logger.debug(`Success: Retrieved detection strategy with id ${detectionStrategy.id}`);
      return res.status(200).send(detectionStrategy);
    }
  } catch (err) {
    if (err instanceof BadlyFormattedParameterError) {
      logger.warn('Badly formatted stix id: ' + req.params.stixId);
      return res.status(400).send('Stix id is badly formatted.');
    } else {
      logger.error('Failed with error: ' + err);
      return res.status(500).send('Unable to get detection strategy. Server error.');
    }
  }
};

exports.create = async function (req, res) {
  // Get the data from the request
  const detectionStrategyData = req.body;
  const options = {
    import: false,
    userAccountId: req.user?.userAccountId,
  };

  // Create the detection strategy
  try {
    const detectionStrategy = await detectionStrategiesService.create(
      detectionStrategyData,
      options,
    );
    logger.debug('Success: Created detection strategy with id ' + detectionStrategy.stix.id);
    return res.status(201).send(detectionStrategy);
  } catch (err) {
    if (err instanceof DuplicateIdError) {
      logger.warn('Duplicate stix.id and stix.modified');
      return res
        .status(409)
        .send(
          'Unable to create detection strategy. Duplicate stix.id and stix.modified properties.',
        );
    } else {
      logger.error('Failed with error: ' + err);
      return res.status(500).send('Unable to create detection strategy. Server error.');
    }
  }
};

exports.updateFull = async function (req, res) {
  // Get the data from the request
  const detectionStrategyData = req.body;

  // Create the detection strategy
  try {
    const detectionStrategy = await detectionStrategiesService.updateFull(
      req.params.stixId,
      req.params.modified,
      detectionStrategyData,
    );
    if (!detectionStrategy) {
      return res.status(404).send('Detection strategy not found.');
    } else {
      logger.debug('Success: Updated detection strategy with id ' + detectionStrategy.stix.id);
      return res.status(200).send(detectionStrategy);
    }
  } catch (err) {
    logger.error('Failed with error: ' + err);
    return res.status(500).send('Unable to update detection strategy. Server error.');
  }
};

exports.deleteVersionById = async function (req, res) {
  try {
    const detectionStrategy = await detectionStrategiesService.deleteVersionById(
      req.params.stixId,
      req.params.modified,
    );
    if (!detectionStrategy) {
      return res.status(404).send('Detection strategy not found.');
    } else {
      logger.debug('Success: Deleted detection strategy with id ' + detectionStrategy.stix.id);
      return res.status(204).end();
    }
  } catch (err) {
    logger.error('Delete detection strategy failed. ' + err);
    return res.status(500).send('Unable to delete detection strategy. Server error.');
  }
};

exports.deleteById = async function (req, res) {
  try {
    const detectionStrategies = await detectionStrategiesService.deleteById(req.params.stixId);
    if (detectionStrategies.deletedCount === 0) {
      return res.status(404).send('Detection strategies not found.');
    } else {
      logger.debug(`Success: Deleted detection strategy with id ${req.params.stixId}`);
      return res.status(204).end();
    }
  } catch (err) {
    logger.error('Delete detection strategy failed. ' + err);
    return res.status(500).send('Unable to delete detection strategy. Server error.');
  }
};
