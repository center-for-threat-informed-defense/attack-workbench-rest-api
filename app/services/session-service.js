'use strict';

exports.retrieveCurrentSession = async function() {
    // Stub
    const currentSession = {
        email: 'user@mitre.org',
        name: 'User User',
        status: 'active',
        role: 'editor',
        identity: null,
        registered: true
    };
    return currentSession;
}
