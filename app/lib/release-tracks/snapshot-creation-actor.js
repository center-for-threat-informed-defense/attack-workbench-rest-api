'use strict';

// Use trusted invocation context, never the source snapshot or track creator.
module.exports = function creationActor(userAccountId) {
  if (userAccountId === 'system') return { kind: 'system' };
  return userAccountId ? { kind: 'user', user_account_id: userAccountId } : { kind: 'unknown' };
};
