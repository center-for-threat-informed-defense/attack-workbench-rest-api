'use strict';

// Plans and commits immutable releases from release-track snapshots. Planning
// is side-effect free; persistence, reconciliation, and events occur only in
// the commit path.

const snapshotService = require('./snapshot-service');
const dynamicRepo = require('../../repository/release-tracks/release-track-dynamic.repository');
const versionUtils = require('../../lib/release-tracks/version-utils');
const conflictResolution = require('../../lib/release-tracks/conflict-resolution');
const tierRevisionInvariant = require('../../lib/release-tracks/tier-revision-invariant');
const revisionReference = require('../../lib/release-tracks/revision-reference');
const releaseHistoryService = require('./release-history-service');
const primaryRevisionService = require('./primary-revision-service');
const graphManifestService = require('./graph-manifest-service');
const logger = require('../../lib/logger');
const {
  AlreadyReleasedError,
  ReleaseConflictError,
  VirtualSnapshotNotMaterializedError,
} = require('../../exceptions');

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

function memberRevisions(snapshot) {
  const revisionsByObject = new Map();
  for (const member of snapshot?.members || []) {
    const revisions = revisionsByObject.get(member.object_ref) || new Set();
    revisions.add(iso(member.object_modified));
    revisionsByObject.set(member.object_ref, revisions);
  }
  return revisionsByObject;
}

function sameRevisions(left, right) {
  if (left.size !== right.size) return false;
  for (const revision of left) {
    if (!right.has(revision)) return false;
  }
  return true;
}

function virtualReleaseChanges(previousSnapshot, draftSnapshot) {
  const previous = memberRevisions(previousSnapshot);
  const draft = memberRevisions(draftSnapshot);
  let newCount = 0;
  let updatedCount = 0;
  let removedCount = 0;

  for (const [objectRef, revisions] of draft) {
    const previousRevisions = previous.get(objectRef);
    if (!previousRevisions) {
      newCount++;
    } else if (!sameRevisions(revisions, previousRevisions)) {
      updatedCount++;
    }
  }

  for (const objectRef of previous.keys()) {
    if (!draft.has(objectRef)) removedCount++;
  }

  return {
    new_count: newCount,
    updated_count: updatedCount,
    removed_count: removedCount,
    quarantined_count: (draftSnapshot.quarantine || []).length,
  };
}

/**
 * Capture the tagged component versions frozen into a materialized virtual
 * draft. Track IDs are stable provenance keys; component names are descriptive
 * metadata and may change or collide.
 */
function virtualComponentVersions(snapshot) {
  return Object.fromEntries(
    (snapshot.composition_resolution?.component_snapshots || []).map((component) => [
      component.track_id,
      component.resolved_version,
    ]),
  );
}

/**
 * Build the complete release plan without reading or writing external state.
 *
 * @param {string} trackId
 * @param {Object} sourceSnapshot
 * @param {Array<Object>} versionHistory
 * @param {Object} options
 * @param {Date} now
 * @param {Object|null} previousTaggedSnapshot
 * @returns {Object}
 */
function planRelease(
  trackId,
  sourceSnapshot,
  versionHistory,
  options = {},
  now = new Date(),
  previousTaggedSnapshot = null,
) {
  if (sourceSnapshot.version != null) {
    throw new AlreadyReleasedError(sourceSnapshot.version);
  }
  if (sourceSnapshot.type === 'virtual' && sourceSnapshot.composition_resolution == null) {
    throw new VirtualSnapshotNotMaterializedError(trackId, {
      details:
        'Create a persisted draft with POST /api/release-tracks/:id/virtual/snapshots/create before previewing or releasing it',
    });
  }
  if (
    sourceSnapshot.type === 'standard' &&
    (sourceSnapshot.staged || []).some((entry) => revisionReference.isLatest(entry.object_modified))
  ) {
    throw new TypeError('Standard release planning requires resolved staged revisions');
  }

  const normalized = tierRevisionInvariant.normalizeSnapshot(sourceSnapshot);
  const snapshot = normalized.snapshot;
  const version = versionUtils.calculateNextVersion(
    versionHistory,
    options.increment,
    options.version,
  );
  versionUtils.validateVersionProgression(version, versionHistory);

  const isVirtual = snapshot.type === 'virtual';
  const before = isVirtual
    ? previousTaggedSnapshot
      ? tierCounts(previousTaggedSnapshot)
      : { members_count: 0, quarantine_count: 0 }
    : tierCounts(snapshot);
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
  const changes = isVirtual
    ? virtualReleaseChanges(previousTaggedSnapshot, afterSnapshot)
    : {
        promoted_count: blockingError ? 0 : staged.length,
      };
  const versionHistoryEntry = {
    version,
    tagged_at: now,
    tagged_by: options.userAccountId || 'system',
    snapshot_id: sourceSnapshot.modified,
    summary: {
      ...after,
      promoted_count: blockingError ? 0 : staged.length,
    },
    component_versions: isVirtual ? virtualComponentVersions(snapshot) : undefined,
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
      ...(isVirtual
        ? {
            previous_release: previousTaggedSnapshot
              ? {
                  version: previousTaggedSnapshot.version,
                  modified: iso(previousTaggedSnapshot.modified),
                }
              : null,
          }
        : {}),
      before,
      after: blockingError ? before : after,
      changes,
      conflicts: blockingError?.conflicts || [],
    },
  };
}

async function planLoadedSnapshot(trackId, snapshot, options) {
  const [versionHistory, previousTaggedSnapshot, resolvedStaged] = await Promise.all([
    releaseHistoryService.getTrackWideVersionHistory(trackId),
    snapshot.type === 'virtual'
      ? dynamicRepo.getLatestTaggedSnapshotBefore(trackId, snapshot.modified)
      : Promise.resolve(null),
    snapshot.type === 'standard'
      ? revisionReference.resolveEntries(snapshot.staged || [])
      : Promise.resolve(snapshot.staged || []),
  ]);
  const releaseInput =
    snapshot.type === 'standard'
      ? {
          ...snapshot,
          staged: resolvedStaged,
        }
      : snapshot;

  await primaryRevisionService.assertStoredEntries([
    ...(releaseInput.members || []),
    ...(releaseInput.staged || []),
  ]);

  return planRelease(
    trackId,
    releaseInput,
    versionHistory,
    options,
    new Date(),
    previousTaggedSnapshot,
  );
}

async function commitPlan(plan) {
  if (plan.blockingError) throw plan.blockingError;

  const manifestId = await graphManifestService.prepare(plan.plannedSnapshot);

  let tagged;
  try {
    tagged = await dynamicRepo.tagSnapshotInPlace(plan.trackId, plan.sourceSnapshot.modified, {
      version: plan.version,
      versionHistoryEntry: plan.versionHistoryEntry,
      additionalOps: {
        ...plan.additionalOps,
        graph_manifest_id: manifestId,
      },
    });
  } catch (err) {
    await graphManifestService.discard(manifestId);
    throw err;
  }

  if (!tagged) {
    await graphManifestService.discard(manifestId);
    await releaseHistoryService.reconcileTaggedReleases(plan.trackId);
    throw new AlreadyReleasedError('(concurrent release)');
  }

  // Link the complete pending manifest before activation. The snapshot link
  // is the durable commit record, and replay can recover a linked pending
  // manifest if the process stops in this narrow window.
  try {
    await graphManifestService.activate(manifestId);
  } catch (err) {
    logger.warn(
      `VersioningService: Deferred activation for graph manifest "${manifestId}": ${err.message}`,
    );
  }

  if (
    plan.sourceSnapshot.graph_manifest_id &&
    plan.sourceSnapshot.graph_manifest_id !== manifestId
  ) {
    await graphManifestService.discard(plan.sourceSnapshot.graph_manifest_id);
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
exports._private = {
  memberRevisions,
  sameRevisions,
  virtualComponentVersions,
  virtualReleaseChanges,
};

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
