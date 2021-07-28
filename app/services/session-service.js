'use strict';

exports.retrieveCurrentSession = function(user) {
    let currentSession;
    if (user) {
        currentSession = {
            email: null,
            name: 'anonymous',
            status: 'active',
            role: 'admin',
            identity: null,
            registered: true
        };
    }

    return currentSession;
}
