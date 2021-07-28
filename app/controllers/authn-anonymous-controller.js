'use strict';

const logger = require('../lib/logger');

exports.login = function(req, res) {
    if (req.user) {
        logger.info(`Success: User logged in with uuid: ${ req.user.userId }`);
        return res.status(200).send('User logged in');
    }
    else {
        logger.warn('Unable to log user in, failed with error: req.user not found');
        return res.status(401).send('Not authorized');
    }
};

exports.logout = function(req, res) {
    try {
        const userId = req.user.userId;
        req.logout();
        logger.info(`Success: User logged out with uuid: ${ userId }`);
        return res.status(200).send('User logged out');
    }
    catch(err) {
        logger.error('Unable to log out anonymous user, failed with error: ' + err);
        return res.status(500).send('Unable to log out anonymous user. Server error.');
    }
};
