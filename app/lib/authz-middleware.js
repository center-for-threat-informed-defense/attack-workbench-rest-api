'use strict';

const logger = require('../lib/logger');

exports.roles = {
    admin: 'admin',
    editor: 'editor',
    visitor: 'visitor'
}

/**
 * This middleware function verifies that a request is authorized.
 */
exports.requireRole = function(roles) {
    return function(req, res, next) {
        if (!req.user) {
            return res.status(401).send('Not authorized');
        }
        else if (!roles.includes(req.user.role)) {
            logger.verbose(`User not authorized. User role is ${ req.user.role }`);
            return res.status(401).send('Not authorized');
        }
        else {
            next();
        }
    }
}
