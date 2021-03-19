'use strict';

const fs = require('fs');
const config = require('../config/config');

let allowedValues;

exports.retrieveAllowedValues = function(callback) {
    if (allowedValues) {
        // Return existing object asynchronously
        process.nextTick(() => callback(null, allowedValues));
    }
    else {
        fs.readFile(config.configurationFiles.allowedValues, (err, data) => {
            if (err) {
                return callback(err);
            }
            else {
                try {
                    allowedValues = JSON.parse(data);
                    return callback(null, allowedValues);
                }
                catch (error) {
                    return callback(error);
                }
            }
        });
    }
}
