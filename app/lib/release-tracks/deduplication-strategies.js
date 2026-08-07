'use strict';

// =============================================================================
// Deduplication Strategies
//
// Resolves duplicate objects when multiple component tracks contribute the same
// STIX object (same object_ref) to a virtual track snapshot.
//
// Strategies:
//   prioritize_latest_object    – Keep the version with the newest object_modified
//   prioritize_latest_snapshot  – Keep the version from the most recently modified component snapshot
//   prioritize_higher_priority  – Keep the version from the higher-priority component (lower number)
//   quarantine                  – Send all conflicting versions to quarantine for manual review
//
// Input members are annotated with source metadata:
//   _source_track_id, _source_track_name, _source_snapshot_modified,
//   _source_snapshot_version, _source_priority
// =============================================================================

/**
 * Deduplicate members collected from multiple component tracks.
 *
 * @param {Array<Object>} allMembers - Annotated member entries from all components.
 *   Each entry: { object_ref, object_modified, _source_track_id, _source_track_name,
 *                 _source_snapshot_modified, _source_snapshot_version, _source_priority }
 * @param {string} strategy - One of the four deduplication strategies
 * @returns {{ members: Array<Object>, quarantined: Array<Object>,
 *   contributions: Array<Object>, report: Object }}
 */
exports.deduplicate = function deduplicate(allMembers, strategy) {
  // Group entries by object_ref to identify duplicates
  const groups = new Map();
  for (const entry of allMembers) {
    const key = entry.object_ref;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(entry);
  }

  const members = [];
  const quarantined = [];
  const contributions = [];
  const conflictsResolved = [];
  let duplicatesFound = 0;

  for (const [objectRef, entries] of groups) {
    if (entries.length > 1) {
      duplicatesFound += 1;
    }

    const distinctRevisions = _collapseExactRevisions(entries, strategy);
    if (distinctRevisions.length === 1) {
      // No conflict — one distinct revision with one selected source
      _addMember(distinctRevisions[0], members, contributions);
      continue;
    }

    // Conflict: same object_ref with genuinely different revisions
    switch (strategy) {
      case 'prioritize_latest_object':
        _resolveByLatestObject(
          objectRef,
          distinctRevisions,
          members,
          contributions,
          conflictsResolved,
        );
        break;

      case 'prioritize_latest_snapshot':
        _resolveByLatestSnapshot(
          objectRef,
          distinctRevisions,
          members,
          contributions,
          conflictsResolved,
        );
        break;

      case 'prioritize_higher_priority':
        _resolveByHigherPriority(
          objectRef,
          distinctRevisions,
          members,
          contributions,
          conflictsResolved,
        );
        break;

      case 'quarantine':
        _resolveByQuarantine(objectRef, distinctRevisions, quarantined, conflictsResolved);
        break;

      default:
        throw new Error(`Unknown deduplication strategy: ${strategy}`);
    }
  }

  const report = {
    total_objects_before: allMembers.length,
    total_objects_after: members.length,
    duplicates_found: duplicatesFound,
    conflicts_resolved: conflictsResolved,
  };

  return { members, quarantined, contributions, report };
};

// =============================================================================
// Strategy implementations
// =============================================================================

/**
 * Keep the entry with the most recent object_modified timestamp.
 */
function _resolveByLatestObject(objectRef, entries, members, contributions, conflictsResolved) {
  let winner = entries[0];
  for (let i = 1; i < entries.length; i++) {
    if (
      new Date(entries[i].object_modified).getTime() > new Date(winner.object_modified).getTime()
    ) {
      winner = entries[i];
    }
  }

  _addMember(winner, members, contributions);
  conflictsResolved.push({
    object_ref: objectRef,
    strategy: 'prioritize_latest_object',
    winner_source: winner._source_track_id,
    winner_modified: winner.object_modified,
    candidates_count: entries.length,
  });
}

/**
 * Keep the entry from the component track whose resolved snapshot has the
 * most recent modified timestamp.
 */
function _resolveByLatestSnapshot(objectRef, entries, members, contributions, conflictsResolved) {
  let winner = entries[0];
  for (let i = 1; i < entries.length; i++) {
    if (_preferLatestSnapshot(entries[i], winner)) {
      winner = entries[i];
    }
  }

  _addMember(winner, members, contributions);
  conflictsResolved.push({
    object_ref: objectRef,
    strategy: 'prioritize_latest_snapshot',
    winner_source: winner._source_track_id,
    winner_snapshot_modified: winner._source_snapshot_modified,
    candidates_count: entries.length,
  });
}

/**
 * Keep the entry from the component track with the highest priority
 * (lowest priority number).
 */
function _resolveByHigherPriority(objectRef, entries, members, contributions, conflictsResolved) {
  let winner = entries[0];
  for (let i = 1; i < entries.length; i++) {
    if (_preferHigherPriority(entries[i], winner)) {
      winner = entries[i];
    }
  }

  _addMember(winner, members, contributions);
  conflictsResolved.push({
    object_ref: objectRef,
    strategy: 'prioritize_higher_priority',
    winner_source: winner._source_track_id,
    winner_priority: winner._source_priority,
    candidates_count: entries.length,
  });
}

/**
 * Send all conflicting versions to quarantine for manual resolution.
 * No entry is added to members for this object_ref.
 */
function _resolveByQuarantine(objectRef, entries, quarantined, conflictsResolved) {
  for (const entry of entries) {
    quarantined.push({
      object_ref: entry.object_ref,
      object_modified: entry.object_modified,
      source_track_id: entry._source_track_id,
      source_track_name: entry._source_track_name,
      source_snapshot_version: entry._source_snapshot_version,
      conflict_reason: 'duplicate_object',
    });
  }

  conflictsResolved.push({
    object_ref: objectRef,
    strategy: 'quarantine',
    quarantined_count: entries.length,
  });
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Strip internal source-tracking metadata from an entry, returning a clean
 * member entry suitable for persistence.
 */
function _stripSourceMeta(entry) {
  return {
    object_ref: entry.object_ref,
    object_modified: entry.object_modified,
  };
}

/**
 * Collapse repeated contributions of an exact object revision to one source.
 * Source ownership follows the active strategy where it can distinguish the
 * sources, then falls back to the required unique component priority.
 */
function _collapseExactRevisions(entries, strategy) {
  const revisions = new Map();

  for (const entry of entries) {
    const revisionKey = new Date(entry.object_modified).getTime();
    const current = revisions.get(revisionKey);
    if (!current || _preferSource(entry, current, strategy)) {
      revisions.set(revisionKey, entry);
    }
  }

  return Array.from(revisions.values());
}

function _preferSource(candidate, current, strategy) {
  if (strategy === 'prioritize_latest_snapshot') {
    return _preferLatestSnapshot(candidate, current);
  }
  return _preferHigherPriority(candidate, current);
}

function _preferLatestSnapshot(candidate, current) {
  const candidateTime = new Date(candidate._source_snapshot_modified).getTime();
  const currentTime = new Date(current._source_snapshot_modified).getTime();
  if (candidateTime !== currentTime) {
    return candidateTime > currentTime;
  }
  return _preferHigherPriority(candidate, current);
}

function _preferHigherPriority(candidate, current) {
  return candidate._source_priority < current._source_priority;
}

function _addMember(entry, members, contributions) {
  members.push(_stripSourceMeta(entry));
  contributions.push({
    object_ref: entry.object_ref,
    object_modified: entry.object_modified,
    source_track_id: entry._source_track_id,
  });
}
