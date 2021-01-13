'use strict';

exports.import = function(data, callback) {
    process.nextTick(() => {
        return callback(null, {})
    });
};
