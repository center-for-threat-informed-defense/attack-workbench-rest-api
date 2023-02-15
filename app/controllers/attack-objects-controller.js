'use strict';

const attackObjectsService = require('../services/attack-objects-service');
const logger = require('../lib/logger');

exports.retrieveAll = async function(req, res) {
    const options = {
        attackId: req.query.attackId,
        offset: req.query.offset || 0,
        limit: req.query.limit || 0,
        state: req.query.state,
        includeRevoked: req.query.includeRevoked,
        includeDeprecated: req.query.includeDeprecated,
        includeDeleted: req.query.includeDeleted,
        search: req.query.search,
        includePagination: req.query.includePagination,
        versions: req.query.versions
    };

    try {
        const results = await attackObjectsService.retrieveAll(options);

        if (options.includePagination) {
            logger.debug(`Success: Retrieved ${results.data.length} of ${results.pagination.total} total ATT&CK object(s)`);
        }
        else {
            logger.debug(`Success: Retrieved ${results.length} ATT&CK object(s)`);
        }

        return res.status(200).send(results);
    }
    catch (err) {
        logger.error('Failed with error: ' + err);
        return res.status(500).send('Unable to get ATT&CK objects. Server error.');
    }
};

exports.makeDeleteByIdSync = function(service) {
    return function(req, res) {
        const options = {
            softDelete: req.query.softDelete
        };

        service.deleteById(req.params.stixId, options, function (err, deletedCount) {
            if (err) {
                logger.error('Delete ATT&CK object failed. ' + err);
                return res.status(500).send('Unable to delete ATT&CK object. Server error.');
            }
            else {
                if (deletedCount === 0) {
                    return res.status(404).send('Unable to delete ATT&CK object. ATT&CK object not found.');
                }
                else {
                    logger.debug(`Success: Deleted ${deletedCount} versions of ATT&CK object with id ${req.params.stixId}`);
                    return res.status(204).end();
                }
            }
        });
    }
};

exports.makeDeleteVersionByIdSync = function(service) {
    return function(req, res) {
        const options = {
            softDelete: req.query.softDelete
        };

        service.deleteVersionById(req.params.stixId, req.params.modified, options, function (err, attackObject) {
            if (err) {
                logger.error('Delete ATT&CK object failed. ' + err);
                return res.status(500).send('Unable to delete ATT&CK object. Server error.');
            }
            else {
                if (!attackObject) {
                    return res.status(404).send('ATT&CK object not found.');
                }
                else {
                    logger.debug("Success: Deleted ATT&CK object with id " + attackObject.stix.id);
                    return res.status(204).end();
                }
            }
        });
    }
};
