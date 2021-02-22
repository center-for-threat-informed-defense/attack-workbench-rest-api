'use strict';

const attackObjectsService = require('../services/attack-objects-service');
const logger = require('../lib/logger');

exports.retrieveAll = function(req, res) {
    const options = {
        offset: req.query.offset || 0,
        limit: req.query.limit || 0,
        state: req.query.state,
        includeRevoked: req.query.includeRevoked,
        includeDeprecated: req.query.includeDeprecated,
        includePagination: req.query.includePagination
    }

    attackObjectsService.retrieveAll(options, function(err, results) {
        if (err) {
            logger.error('Failed with error: ' + err);
            return res.status(500).send('Unable to get ATT&CK objects. Server error.');
        }
        else {
            if (options.includePagination) {
                logger.debug(`Success: Retrieved ${ results.data.length } of ${ results.pagination.total } total ATT&CK object(s)`);
            }
            else {
                logger.debug(`Success: Retrieved ${ results.length } ATT&CK object(s)`);
            }
            return res.status(200).send(results);
        }
    });
};
