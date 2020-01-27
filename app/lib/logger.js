'use strict';

const winston = require('winston');

const consoleFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(info => `${ info.timestamp } [${ info.level.toUpperCase() }] ${ info.message }`)
);

const logLevels = {
    error: 0,
    warn: 1,
    http: 2,
    info: 3,
    verbose: 4,
    debug: 5
};

const logger = winston.createLogger({
    format: consoleFormat,
    transports: [
        new winston.transports.Console()
    ],
    levels: logLevels
});

logger.stream = {
    write: function(message, encoding) {
        // Write to the log. Remove the last character to avoid double 'new line' characters.
        logger.http(message.slice(0, -1));
    }
};

module.exports = logger;
