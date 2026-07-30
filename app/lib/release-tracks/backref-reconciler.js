'use strict';

// =============================================================================
// Release Track Backref Reconciler
//
// Maintains the reverse pointers (`workspace.release_tracks`) that STIX object
// documents carry back to the release tracks that reference them. Each entry
// has the shape:
//
//   {
//     id: 'release-track--<uuid>',
//     type: 'standard'|'virtual',
//     tier: 'members'|'staged'|'candidates'|'quarantine',
//     status: 'modified-in-place'|'work-in-progress'|'awaiting-review'|'reviewed'
//   }
//
// Backrefs are pinned to specific object revisions: the entry lives on the
// exact (stix.id, stix.modified) document that the track's tier entry pins.
//
// Reconciliation is snapshot-driven and idempotent: given a track's current
// (latest) snapshot, compute the desired set of backrefs and diff it against
// the documents that currently carry an entry for that track. This single
// code path covers every membership mutation (add/remove/review/promote/
// demote/release/member-sync/clone/bundle-import) as well as
// snapshot deletion (membership reverts to the new latest snapshot) and
// track deletion (snapshot = null removes all entries).
//
// Called from EventBus listeners (RELEASE_TRACK_CONTENTS_CHANGED) in
// attack-objects-service and relationships-service — each service reconciles
// only the documents in its own collection, selected via `includeRef`.
// =============================================================================

const logger = require('../logger');
const revisionReference = require('./revision-reference');

// Snapshot tier array names, also used verbatim as the backref `tier` value.
// Order matters: if a revision somehow appears in multiple tiers, the first
// tier listed here wins.
const TIERS = ['members', 'staged', 'candidates', 'quarantine'];

function versionKey(objectRef, objectModified) {
  return `${objectRef}|${new Date(objectModified).toISOString()}`;
}

/**
 * Derive the backref status for a tier entry.
 * Members are inherently 'reviewed'; quarantined entries (virtual tracks)
 * carry no workflow status.
 */
function entryStatus(tierName, entry) {
  switch (tierName) {
    case 'members':
      return 'reviewed';
    case 'staged':
      return entry.object_status || 'reviewed';
    case 'candidates':
      return entry.object_status || 'work-in-progress';
    default:
      return entry.object_status || undefined;
  }
}

/**
 * Compute the desired backref entries from a snapshot.
 *
 * @param {Object|null} snapshot - The track's latest snapshot (null = no membership)
 * @param {function(string): boolean} includeRef - Filter on object_ref; lets each
 *   collection's listener reconcile only its own documents
 * @returns {Map<string, {objectRef: string, objectModified: Date, tier: string, status: string|undefined}>}
 */
function computeDesiredEntries(snapshot, includeRef) {
  const desired = new Map();
  if (!snapshot) return desired;

  for (const tierName of TIERS) {
    for (const entry of snapshot[tierName] || []) {
      if (!includeRef(entry.object_ref)) continue;

      const key = versionKey(entry.object_ref, entry.object_modified);
      if (desired.has(key)) continue; // earlier tier wins

      desired.set(key, {
        objectRef: entry.object_ref,
        objectModified: entry.object_modified,
        tier: tierName,
        status: entryStatus(tierName, entry),
      });
    }
  }

  return desired;
}

/**
 * Reconcile workspace.release_tracks backrefs for one track against one
 * document collection.
 *
 * @param {Object} repository - A BaseRepository instance (provides
 *   retrieveReleaseTrackRefsLean, retrieveVersionRefsLean, bulkWrite)
 * @param {string} trackId - The release track ID
 * @param {Object|null} snapshot - The track's latest snapshot (null = remove all)
 * @param {function(string): boolean} includeRef - Filter on object_ref
 * @returns {Promise<{added: number, updated: number, removed: number}>}
 */
async function reconcile(repository, trackId, snapshot, includeRef) {
  let resolvedSnapshot = snapshot;
  if (snapshot) {
    const latestByObjectRef = new Map();
    resolvedSnapshot = { ...snapshot };
    for (const tierName of TIERS) {
      resolvedSnapshot[tierName] = await revisionReference.resolveEntries(
        (snapshot[tierName] || []).filter((entry) => includeRef(entry.object_ref)),
        latestByObjectRef,
      );
    }
  }

  const desired = computeDesiredEntries(resolvedSnapshot, includeRef);
  const current = await repository.retrieveReleaseTrackRefsLean(trackId);

  const operations = [];
  const counts = { added: 0, updated: 0, removed: 0 };
  const satisfied = new Set();

  for (const document of current) {
    const key = versionKey(document.stix.id, document.stix.modified);
    const want = desired.get(key);

    if (!want) {
      operations.push({
        updateOne: {
          filter: { _id: document._id },
          update: { $pull: { 'workspace.release_tracks': { id: trackId } } },
        },
      });
      counts.removed++;
      continue;
    }

    satisfied.add(key);
    const existing = (document.workspace.release_tracks || []).find((e) => e.id === trackId);
    if (
      existing &&
      existing.tier === want.tier &&
      (existing.status || undefined) === want.status &&
      existing.type === snapshot.type
    ) {
      continue; // already correct
    }

    const update = {
      $set: {
        'workspace.release_tracks.$.tier': want.tier,
        'workspace.release_tracks.$.type': snapshot.type,
      },
    };
    if (want.status === undefined) {
      update.$unset = { 'workspace.release_tracks.$.status': '' };
    } else {
      update.$set['workspace.release_tracks.$.status'] = want.status;
    }
    operations.push({
      updateOne: {
        filter: { _id: document._id, 'workspace.release_tracks.id': trackId },
        update,
      },
    });
    counts.updated++;
  }

  // Add entries to pinned revisions that don't carry one yet
  const missing = [...desired.entries()].filter(([key]) => !satisfied.has(key));
  if (missing.length > 0) {
    const revisions = await repository.retrieveVersionRefsLean(
      missing.map(([, want]) => ({
        object_ref: want.objectRef,
        object_modified: want.objectModified,
      })),
    );
    const documentsByKey = new Map(
      revisions.map((doc) => [versionKey(doc.stix.id, doc.stix.modified), doc]),
    );

    for (const [key, want] of missing) {
      const document = documentsByKey.get(key);
      if (!document) {
        // Pinned revision does not exist in this collection — either it lives
        // in the other collection (handled by that listener) or the pin is
        // dangling. Reconciliation self-heals on the next contents change.
        continue;
      }

      const entry = {
        id: trackId,
        type: snapshot.type,
        tier: want.tier,
      };
      if (want.status !== undefined) {
        entry.status = want.status;
      }
      operations.push({
        updateOne: {
          filter: { _id: document._id },
          update: { $push: { 'workspace.release_tracks': entry } },
        },
      });
      counts.added++;
    }
  }

  if (operations.length > 0) {
    await repository.bulkWrite(operations);
    logger.verbose(
      `BackrefReconciler: track "${trackId}" — added ${counts.added}, ` +
        `updated ${counts.updated}, removed ${counts.removed} backref(s)`,
    );
  }

  return counts;
}

module.exports = {
  reconcile,
  // exported for unit testing
  computeDesiredEntries,
  versionKey,
};
