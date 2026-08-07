'use strict';

// =============================================================================
// Release Track Workflow Gate
//
// Single decision point for where a tracked object's tier entry belongs
// after a change reaches revision sync. All placement rules — the supplant
// status policy, the modified-in-place marker, and the candidacy-threshold /
// auto-promotion check — are codified here instead of being scattered
// through the versioning code. Given the priors (what triggered the change,
// how the entry enters the tier arrays, the entry's previous state, the
// track configuration), the gate returns the entry's new tier and status.
// =============================================================================

// Track-entry workflow statuses. 'modified-in-place' marks entries whose
// pinned revision was changed by an in-place PUT: the content changed, but
// because in-place edits carry no revision history the track cannot say
// *what* changed — only that a re-review is required.
const TRACK_ENTRY_STATUSES = [
  'modified-in-place',
  'work-in-progress',
  'awaiting-review',
  'reviewed',
];

// 'modified-in-place' ranks with 'work-in-progress': both mean "not reviewed
// in its current state". A permissive track (candidacy_threshold
// 'work-in-progress') therefore stages modified-in-place entries too.
const STATUS_RANK = {
  'modified-in-place': 0,
  'work-in-progress': 0,
  'awaiting-review': 1,
  reviewed: 2,
};

/**
 * Check whether a track-entry status meets or exceeds the configured
 * candidacy threshold.
 *
 * @param {string} status - The entry's workflow status
 * @param {string} threshold - The configured candidacy threshold
 * @returns {boolean}
 */
function meetsCandidacyThreshold(status, threshold) {
  const statusRank = STATUS_RANK[status];
  const thresholdRank = STATUS_RANK[threshold];

  if (statusRank === undefined || thresholdRank === undefined) {
    return false;
  }

  return statusRank >= thresholdRank;
}

/**
 * Decide the tier and status of a tracked object's entry after a change.
 *
 * @param {Object} priors
 * @param {'new-revision'|'in-place-update'|'revocation'} priors.trigger -
 *   The operation that produced the change
 * @param {'move-pin'|'queue'|'enroll'} priors.mode - How the entry enters
 *   the tier arrays: move-pin replaces the previous entry, queue adds a
 *   second entry alongside it, enroll creates the object's first entry
 * @param {{tier: string, status: string}|null} priors.previousEntry - The
 *   entry being replaced (move-pin) or null
 * @param {'reset'|'preserve'} priors.statusPolicy - member_sync supplant
 *   status policy
 * @param {string} priors.candidacyThreshold - config.candidacy_threshold
 * @param {boolean} priors.autoPromote - config.auto_promote
 * @returns {{tier: 'candidates'|'staged', status: string}}
 */
function decidePlacement({
  trigger,
  mode,
  previousEntry,
  statusPolicy,
  candidacyThreshold,
  autoPromote,
}) {
  // --- Status ---
  let status;
  if (trigger === 'in-place-update') {
    // The pinned content itself changed with no revision history to diff —
    // mark the entry so reviewers know a re-review is required and why.
    status = 'modified-in-place';
  } else if (
    statusPolicy === 'preserve' &&
    previousEntry?.status &&
    previousEntry.status !== 'modified-in-place'
  ) {
    // A new revision replacing a modified-in-place pin is a fresh explicit
    // version — never carry the in-place marker onto it.
    status = previousEntry.status;
  } else {
    status = 'work-in-progress';
  }

  // --- Tier ---
  let tier;
  if (mode === 'queue') {
    // Queued entries always start in candidates; they reach staged through
    // review / auto-promotion like any other candidate.
    tier = 'candidates';
  } else if (autoPromote === true && meetsCandidacyThreshold(status, candidacyThreshold)) {
    // Codified auto-promotion: place directly in staged instead of bouncing
    // through candidates and a second snapshot. In a permissive track an
    // in-place edit of a staged entry therefore keeps its staged tier
    // (status still flips to modified-in-place).
    tier = 'staged';
  } else if (trigger !== 'in-place-update' && statusPolicy === 'preserve' && previousEntry) {
    // Preserve keeps the entry in the tier it already occupied.
    tier = previousEntry.tier;
  } else {
    // Default: (back) to candidates for review. This is how an in-place
    // edit demotes a staged entry in a strict track.
    tier = 'candidates';
  }

  return { tier, status };
}

module.exports = {
  TRACK_ENTRY_STATUSES,
  STATUS_RANK,
  meetsCandidacyThreshold,
  decidePlacement,
};
