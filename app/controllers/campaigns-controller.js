'use strict';

const campaignsService = require('../services/campaigns-service');
const logger = require('../lib/logger');

exports.retrieveAll = function(req, res) {
    const options = {
        offset: req.query.offset || 0,
        limit: req.query.limit || 0,
        state: req.query.state,
        includeRevoked: req.query.includeRevoked,
        includeDeprecated: req.query.includeDeprecated,
        search: req.query.search,
        lastUpdatedBy: req.query.lastUpdatedBy,
        includePagination: req.query.includePagination
    }

    campaignsService.retrieveAll(options, function(err, results) {
        if (err) {
            logger.error('Failed with error: ' + err);
            return res.status(500).send('Unable to get campaigns. Server error.');
        }
        else {
            if (options.includePagination) {
                logger.debug(`Success: Retrieved ${ results.data.length } of ${ results.pagination.total } total campaign(s)`);
            }
            else {
                logger.debug(`Success: Retrieved ${ results.length } campaign(s)`);
            }
            return res.status(200).send(results);
        }
    });
};

exports.retrieveById = function(req, res) {
    const options = {
        versions: req.query.versions || 'latest'
    }

    campaignsService.retrieveById(req.params.stixId, options, function (err, campaigns) {
        if (err) {
            if (err.message === campaignsService.errors.badlyFormattedParameter) {
                logger.warn('Badly formatted stix id: ' + req.params.stixId);
                return res.status(400).send('Stix id is badly formatted.');
            }
            else if (err.message === campaignsService.errors.invalidQueryStringParameter) {
                logger.warn('Invalid query string: versions=' + req.query.versions);
                return res.status(400).send('Query string parameter versions is invalid.');
            }
            else {
                logger.error('Failed with error: ' + err);
                return res.status(500).send('Unable to get campaigns. Server error.');
            }
        }
        else {
            if (campaigns.length === 0) {
                return res.status(404).send('Campaign not found.');
            }
            else {
                logger.debug(`Success: Retrieved ${ campaigns.length } campaign(s) with id ${ req.params.stixId }`);
                return res.status(200).send(campaigns);
            }
        }
    });
};

exports.retrieveVersionById = function(req, res) {
    campaignsService.retrieveVersionById(req.params.stixId, req.params.modified, function (err, campaign) {
        if (err) {
            if (err.message === campaignsService.errors.badlyFormattedParameter) {
                logger.warn('Badly formatted stix id: ' + req.params.stixId);
                return res.status(400).send('Stix id is badly formatted.');
            }
            else {
                logger.error('Failed with error: ' + err);
                return res.status(500).send('Unable to get campaign. Server error.');
            }
        } else {
            if (!campaign) {
                return res.status(404).send('Campaign not found.');
            }
            else {
                logger.debug(`Success: Retrieved campaign with id ${campaign.id}`);
                return res.status(200).send(campaign);
            }
        }
    });
};

exports.create = async function(req, res) {
    // Get the data from the request
    const campaignData = req.body;

    // Create the campaign
    try {
        const options = {
            import: false,
            userAccountId: req.user?.userAccountId
        };

        const campaign = await campaignsService.create(campaignData, options);
        logger.debug('Success: Created campaign with id ' + campaign.stix.id);
        return res.status(201).send(campaign);
    }
    catch(err) {
        if (err.message === campaignsService.errors.duplicateId) {
            logger.warn('Duplicate stix.id and stix.modified');
            return res.status(409).send('Unable to create campaign. Duplicate stix.id and stix.modified properties.');
        }
        else if (err.message === campaignsService.errors.invalidType) {
            logger.warn('Invalid stix.type');
            return res.status(400).send('Unable to create campaign. stix.type must be campaign');
        }
        else {
            logger.error('Failed with error: ' + err);
            return res.status(500).send('Unable to create campaign. Server error.');
        }
    }
};

exports.updateFull = function(req, res) {
    // Get the data from the request
    const campaignData = req.body;

    // Create the campaign
    campaignsService.updateFull(req.params.stixId, req.params.modified, campaignData, function(err, campaign) {
        if (err) {
            logger.error("Failed with error: " + err);
            return res.status(500).send("Unable to update campaign. Server error.");
        }
        else {
            if (!campaign) {
                return res.status(404).send('Campaign not found.');
            } else {
                logger.debug("Success: Updated campaign with id " + campaign.stix.id);
                return res.status(200).send(campaign);
            }
        }
    });
};

exports.deleteVersionById = function(req, res) {
    campaignsService.deleteVersionById(req.params.stixId, req.params.modified, function (err, campaign) {
        if (err) {
            logger.error('Delete campaign failed. ' + err);
            return res.status(500).send('Unable to delete campaign. Server error.');
        }
        else {
            if (!campaign) {
                return res.status(404).send('Campaign not found.');
            } else {
                logger.debug("Success: Deleted campaign with id " + campaign.stix.id);
                return res.status(204).end();
            }
        }
    });
};

exports.deleteById = function(req, res) {
    campaignsService.deleteById(req.params.stixId, function (err, campaigns) {
        if (err) {
            logger.error('Delete campaign failed. ' + err);
            return res.status(500).send('Unable to delete campaign. Server error.');
        }
        else {
            if (campaigns.deletedCount === 0) {
                return res.status(404).send('Campaign not found.');
            }
            else {
                logger.debug(`Success: Deleted campaigns with id ${ req.params.stixId }`);
                return res.status(204).end();
            }
        }
    });
};
