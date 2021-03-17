'use strict';

const referencesService = require('../services/references-service');
const logger = require('../lib/logger');

exports.retrieveAll = async function(req, res) {
    const options = {
        sourceName: req.query.sourceName,
        offset: req.query.offset || 0,
        limit: req.query.limit || 0,
        search: req.query.search,
        includePagination: req.query.includePagination
    }

    const results = await referencesService.retrieveAll(options)
        .catch(err => {
            logger.error('Failed with error: ' + err);
            return res.status(500).send('Unable to get references. Server error.');
        });

    if (options.includePagination) {
        logger.debug(`Success: Retrieved ${ results.data.length } of ${ results.pagination.total } total reference(s)`);
    }
    else {
        logger.debug(`Success: Retrieved ${ results.length } reference(s)`);
    }
    return res.status(200).send(results);
};

exports.create = async function(req, res) {
    // Get the data from the request
    const referenceData = req.body;

    // The open api validator should catch missing properties, but it isn't working for this one endpoint
    if (!referenceData.source_name || !referenceData.description) {
        return res.status(400).send('Unable to create reference. Missing required properties.');
    }

    // Create the reference
    const reference = await referencesService.create(referenceData)
        .catch(err => {
            if (err.message === referencesService.errors.duplicateId) {
                logger.warn("Duplicate source_name");
                return res.status(409).send('Unable to create reference. Duplicate source_name.');
            } else {
                logger.error("***** Failed with error: " + err);
                return res.status(500).send("Unable to create reference. Server error.");
            }
        });

    logger.debug("Success: Created reference with source_name " + reference.source_name);
    return res.status(201).send(reference);
};

exports.update = async function(req, res) {
    // Get the data from the request
    const referenceData = req.body;

    // Create the reference
    const reference = await referencesService.update(referenceData)
        .catch(err => {
            logger.error('Failed with error: ' + err);
            return res.status(500).send('Unable to update reference. Server error.');
        });

    if (!reference) {
        return res.status(404).send('Reference not found.');
    } else {
        logger.debug('Success: Updated reference with source_name ' + reference.source_name);
        return res.status(200).send(reference);
    }
};
