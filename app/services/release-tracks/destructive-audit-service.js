'use strict';

const logger = require('../../lib/logger');
const auditRepo = require('../../repository/release-tracks/release-track-audit-event.repository');
const { ReleaseTrackAuditError } = require('../../exceptions');

function snapshotResult(snapshot) {
  if (!snapshot) return null;
  return {
    snapshot_modified: snapshot.modified,
    version: snapshot.version ?? null,
    members_count: snapshot.members?.length || 0,
  };
}

exports.execute = async function execute(options, operation) {
  const event = await auditRepo.create(options);
  let operationCompleted = false;

  try {
    const result = await operation();
    operationCompleted = true;
    await auditRepo.complete(event.event_id, options.result?.(result) ?? snapshotResult(result));
    return result;
  } catch (error) {
    if (!operationCompleted) {
      try {
        await auditRepo.fail(event.event_id, error);
      } catch (auditError) {
        logger.error(
          `DestructiveAuditService: Failed to record ${event.event_id} failure: ` +
            auditError.message,
        );
      }
      throw error;
    }

    throw new ReleaseTrackAuditError(options.trackId, event.event_id, {
      details:
        'The destructive release-track operation completed, but its audit record could not be ' +
        'finalized. Inspect the track and audit event before retrying.',
      cause: error,
    });
  }
};
