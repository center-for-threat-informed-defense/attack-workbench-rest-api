'use strict';

const stixBundlesService = require('../services/stix-bundles-service');
const logger = require('../lib/logger');

exports.exportBundle = async function(req, res) {
    if (!req.query.domain) {
        return res.status(400).send('domain is required');
    }

    const options = {
        domain: req.query.domain,
        state: req.query.state,
        includeRevoked: req.query.includeRevoked,
        includeDeprecated: req.query.includeDeprecated,
        includeMissingAttackId: req.query.includeMissingAttackId
    };

    try {
        const stixBundle = await stixBundlesService.exportBundle(options);

        return res.status(200).send(stixBundle);
    }
    catch(err) {
        logger.error('Unable to export STIX bundle: ' + err);
        return res.status(500).send('Unable to export STIX bundle.');
    }
}

