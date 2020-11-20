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
    if (err.errors && err.errors.length >= 1 && (
        err.errors[0].errorCode === 'format.openapi.validation' ||
        err.errors[0].errorCode === 'type.openapi.validation' ||
        err.errors[0].errorCode === 'required.openapi.validation')) {
        logger.warn('Request failed validation');
        logger.info(JSON.stringify(err.errors));
        res.status(400).send('Invalid request.');
    }
    else {
        next(err);
    }
};

exports.invalidPath = function(err, req, res, next) {
    if (err.status === 405) {
        res.status(405).send('Method not allowed.');
    }
    else {
        next(err);
    }
}

exports.catchAll = function(err, req, res, next) {
    logger.error('catch all: ' + err);
    res.status(500).send('Server error.');
};
