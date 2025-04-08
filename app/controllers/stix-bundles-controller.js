'use strict';

const stixBundlesService = require('../services/stix-bundles-service');
const logger = require('../lib/logger');

const validStixVersions = ['2.0', '2.1'];

exports.exportBundle = async function (req, res) {
  if (!req.query.domain) {
    return res.status(400).send('domain is required');
  }

  if (!validStixVersions.includes(req.query.stixVersion)) {
    return res.status(400).send('invalid STIX version');
  }

  const options = {
    domain: req.query.domain,
    state: req.query.state,
    includeRevoked: req.query.includeRevoked,
    includeDeprecated: req.query.includeDeprecated,
    stixVersion: req.query.stixVersion,
    includeMissingAttackId: req.query.includeMissingAttackId,
    includeNotes: req.query.includeNotes,
  };

  try {
    const stixBundle = await stixBundlesService.exportBundle(options);

    return res.status(200).send(stixBundle);
  } catch (err) {
    logger.error('Unable to export STIX bundle: ' + err);
    return res.status(500).send('Unable to export STIX bundle.');
  }
};
