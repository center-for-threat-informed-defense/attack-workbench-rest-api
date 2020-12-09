'use strict';

module.exports.common = {
    domains: [ String ],
    workflow: {
        state: {
            type: String,
            enum: [
                'work-in-progress',
                'awaiting-review',
                'reviewed'
            ]
        }
    }
};
