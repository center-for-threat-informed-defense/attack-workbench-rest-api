'use strict';

const logger = require('./logger');

exports.bodyParser = function(err, req, res, next) {
    if (err.name === 'SyntaxError') {
        logger.warn('Unable to parse body, syntax error: ' + err.type);
        res.status(400).send('Syntax error.');
    }
    else {
        next(err);
    }
};

exports.requestValidation = function(err, req, res, next) {
    if (err.status && err.message) {
        logger.warn('Request failed validation');
        logger.info((JSON.stringify(err)));
        res.status(err.status).send(err.message);
    }
    else {
        next(err);
    }
};

exports.catchAll = function(err, req, res, next) {
    logger.error('catch all: ' + err);
    res.status(500).send('Server error.');
};
