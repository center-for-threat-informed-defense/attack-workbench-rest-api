'use strict';

// Plans and commits immutable releases from release-track snapshots. Planning
// is side-effect free; persistence, reconciliation, and events occur only in
// the commit path.

const snapshotService = require('./snapshot-service');
const dynamicRepo = require('../../repository/release-tracks/release-track-dynamic.repository');
const versionUtils = require('../../lib/release-tracks/version-utils');
const conflictResolution = require('../../lib/release-tracks/conflict-resolution');
const tierRevisionInvariant = require('../../lib/release-tracks/tier-revision-invariant');
const releaseHistoryService = require('./release-history-service');
const logger = require('../../lib/logger');
const { AlreadyReleasedError, ReleaseConflictError } = require('../../exceptions');

function iso(value) {
  return new Date(value).toISOString();
}

function tierCounts(snapshot) {
  if (snapshot.type === 'virtual') {
    return {
      members_count: (snapshot.members || []).length,
      quarantine_count: (snapshot.quarantine || []).length,
    };
  }

  return {
    members_count: (snapshot.members || []).length,
    staged_count: (snapshot.staged || []).length,
    candidates_count: (snapshot.candidates || []).length,
  };
}

/**
 * Build the complete release plan without reading or writing external state.
 *
 * @param {string} trackId
 * @param {Object} sourceSnapshot
 * @param {Array<Object>} versionHistory
 * @param {Object} options
 * @param {Date} now
 * @returns {Object}
 */
function planRelease(trackId, sourceSnapshot, versionHistory, options = {}, now = new Date()) {
  if (sourceSnapshot.version != null) {
    throw new AlreadyReleasedError(sourceSnapshot.version);
  }

  const normalized = tierRevisionInvariant.normalizeSnapshot(sourceSnapshot);
  const snapshot = normalized.snapshot;
  const version = versionUtils.calculateNextVersion(
    versionHistory,
    options.increment,
    options.version,
  );
  versionUtils.validateVersionProgression(version, versionHistory);

  const before = tierCounts(snapshot);
  const staged = snapshot.type === 'standard' ? snapshot.staged || [] : [];
  const existingMembers = snapshot.members || [];
  let mergedMembers = existingMembers;
  let blockingError;

  if (staged.length > 0) {
    const incoming = staged.map(({ object_ref, object_modified }) => ({
      object_ref,
      object_modified,
    }));
    const policy = snapshot.config?.promotion_conflicts?.staged_to_members || 'abort';

    try {
      mergedMembers = conflictResolution.applyConflictPolicy(
        existingMembers,
        incoming,
        policy,
      ).merged;
    } catch (err) {
      if (!(err instanceof ReleaseConflictError)) throw err;
      blockingError = err;
    }
  }

  const additionalOps = {};
  for (const tier of normalized.changedTiers) {
    additionalOps[tier] = snapshot[tier];
  }
  if (staged.length > 0 && !blockingError) {
    additionalOps.members = mergedMembers;
    additionalOps.staged = [];
  }

  const afterSnapshot = {
    ...snapshot,
    version,
    members: mergedMembers,
    ...(snapshot.type === 'standard' ? { staged: [] } : {}),
  };
  const after = tierCounts(afterSnapshot);
  const versionHistoryEntry = {
    version,
    tagged_at: now,
    tagged_by: options.userAccountId || 'system',
    snapshot_id: sourceSnapshot.modified,
    summary: {
      ...after,
      promoted_count: blockingError ? 0 : staged.length,
    },
  };
  const plannedSnapshot = blockingError
    ? null
    : {
        ...afterSnapshot,
        version_history: [...(snapshot.version_history || []), versionHistoryEntry],
      };

  return {
    trackId,
    sourceSnapshot,
    plannedSnapshot,
    version,
    versionHistoryEntry,
    additionalOps,
    normalizedRemoved: normalized.removed,
    blockingError,
    summary: {
      track_id: trackId,
      type: snapshot.type,
      source_snapshot_modified: iso(sourceSnapshot.modified),
      version,
      releasable: !blockingError,
      before,
      after: blockingError ? before : after,
      changes: {
        promoted_count: blockingError ? 0 : staged.length,
      },
      conflicts: blockingError?.conflicts || [],
    },
  };
}

async function planLoadedSnapshot(trackId, snapshot, options) {
  const versionHistory = await releaseHistoryService.getTrackWideVersionHistory(trackId);
  return planRelease(trackId, snapshot, versionHistory, options);
}

async function commitPlan(plan) {
  if (plan.blockingError) throw plan.blockingError;

  const tagged = await dynamicRepo.tagSnapshotInPlace(plan.trackId, plan.sourceSnapshot.modified, {
    version: plan.version,
    versionHistoryEntry: plan.versionHistoryEntry,
    additionalOps: Object.keys(plan.additionalOps).length > 0 ? plan.additionalOps : undefined,
  });

  if (!tagged) {
    await releaseHistoryService.reconcileTaggedReleases(plan.trackId);
    throw new AlreadyReleasedError('(concurrent release)');
  }

  await releaseHistoryService.reconcileTaggedReleases(plan.trackId);
  const latest = await dynamicRepo.getLatestSnapshot(plan.trackId);
  await snapshotService.emitContentsChanged(plan.trackId, latest);

  logger.verbose(
    `VersioningService: Released track "${plan.trackId}" as v${plan.version} ` +
      `(promoted ${plan.summary.changes.promoted_count} staged → members)`,
  );
  if (plan.normalizedRemoved.length > 0) {
    logger.warn(
      `VersioningService: Removed ${plan.normalizedRemoved.length} exact cross-tier revision ` +
        `duplicate(s) while releasing track "${plan.trackId}"`,
    );
  }

  return tagged;
}

exports.planRelease = planRelease;

exports.planLatestRelease = async function planLatestRelease(trackId, options = {}) {
  const snapshot = await snapshotService.getLatestSnapshot(trackId);
  return planLoadedSnapshot(trackId, snapshot, options);
};

exports.planReleaseByModified = async function planReleaseByModified(
  trackId,
  modified,
  options = {},
) {
  const snapshot = await snapshotService.getSnapshotByModified(trackId, modified);
  return planLoadedSnapshot(trackId, snapshot, options);
};

exports.releaseLatest = async function releaseLatest(trackId, options = {}) {
  return commitPlan(await exports.planLatestRelease(trackId, options));
};

exports.releaseByModified = async function releaseByModified(trackId, modified, options = {}) {
  return commitPlan(await exports.planReleaseByModified(trackId, modified, options));
};
