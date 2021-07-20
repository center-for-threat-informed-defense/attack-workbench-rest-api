'use strict';

const sessionService = require('../services/session-service');
const logger = require('../lib/logger');

exports.retrieveCurrentSession = async function(req, res) {
    try {
        const currentSession = await sessionService.retrieveCurrentSession();
        logger.debug('Success: Retrieved current user session.');
        return res.status(200).send(currentSession);
    }
    catch(err) {
        logger.error('Unable to retrieve current user session, failed with error: ' + err);
        return res.status(500).send('Unable to retrieve current user session. Server error.');
    }
};
