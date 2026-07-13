'use strict';

// =============================================================================
// Member Sync Service
//
// Keeps release tracks in sync with new object revisions under the
// track_latest strategy (see member-sync-strategies.md):
//   - Objects in `members`: new revisions are auto-enrolled as candidates.
//   - Objects pinned in `candidates`/`staged`: the pin follows the new
//     revision per the supplant config — otherwise the pin silently goes
//     stale while the author keeps editing, and the release would ship an
//     old revision (the object's latest view would also lose its
//     workspace.release_tracks backref).
//
// Core functionality:
//   - Listens for STIX object modification events via EventBus
//   - Identifies release tracks that reference the modified object
//   - Applies the configured member sync strategy (track_latest vs manual)
//   - Handles supplant behavior (replace/queue/ignore)
//   - Creates new draft snapshots with the updated tiers
//
// This service is event-driven and operates independently of the main
// release track workflow. It integrates with workflow-service for
// auto-promotion after enrollment.
//
// Event Integration:
//   Subscribes to BaseService CRUD events ({type}::created, {type}::updated)
//   via the EventBus. When a STIX object is created or updated, this service
//   checks whether any release track references it and syncs if configured.
//   Relationships are deliberately not subscribed: bundle export pulls
//   active relationships dynamically.
// =============================================================================

const registryRepo = require('../../repository/release-tracks/release-track-registry.repository');
const dynamicRepo = require('../../repository/release-tracks/release-track-dynamic.repository');
const snapshotService = require('./snapshot-service');
const workflowService = require('./workflow-service');
const logger = require('../../lib/logger');
const EventBus = require('../../lib/event-bus');
const EventConstants = require('../../lib/event-constants');

// =============================================================================
// Main entry point
// =============================================================================

/**
 * Handle a STIX object modification event.
 *
 * Identifies release tracks where the object is a member and applies
 * the configured member sync strategy to each.
 *
 * @param {Object} event - The modification event
 * @param {string} event.objectRef - The STIX ID of the modified object
 * @param {Date|string} event.newModified - The new modified timestamp
 * @param {Date|string} [event.oldModified] - The previous modified timestamp (if update)
 * @param {string} [event.modifiedBy] - User who made the modification
 * @returns {Promise<Object[]>} Array of affected release track snapshots
 */
exports.handleObjectModified = async function handleObjectModified(event) {
  const { objectRef, newModified, modifiedBy } = event;

  // 1. Find all release tracks that reference this object (members,
  //    candidates, or staged)
  const affectedTracks = await findTracksReferencingObject(objectRef);

  if (affectedTracks.length === 0) {
    logger.debug(`[member-sync] No release tracks reference ${objectRef}`);
    return [];
  }

  logger.debug(`[member-sync] Found ${affectedTracks.length} track(s) referencing ${objectRef}`);

  // 2. Process each track according to its member_sync config
  const results = [];
  for (const trackInfo of affectedTracks) {
    try {
      const result = await processMemberSync(trackInfo.trackId, trackInfo.snapshot, {
        objectRef,
        newModified,
        modifiedBy,
        isMember: trackInfo.isMember,
      });
      if (result) results.push(result);
    } catch (err) {
      logger.error(`[member-sync] Error processing track ${trackInfo.trackId}: ${err.message}`);
      // Continue processing other tracks; don't let one failure stop all
    }
  }

  return results;
};

// =============================================================================
// Track discovery
// =============================================================================

/**
 * Find all release tracks whose latest snapshot references the given object
 * in the members, candidates, or staged tiers.
 *
 * Members enroll new revisions as candidates; candidate/staged pins follow
 * new revisions per the supplant config — otherwise a pin silently goes
 * stale while the author keeps editing, and the release would ship an old
 * revision.
 *
 * @param {string} objectRef - The STIX ID to search for
 * @returns {Promise<Array<{trackId: string, snapshot: Object, isMember: boolean}>>}
 */
async function findTracksReferencingObject(objectRef) {
  // Get all track IDs from registry
  const allTracks = await registryRepo.findAll({ limit: 10000 });
  const results = [];

  for (const trackInfo of allTracks.data) {
    // Skip virtual tracks (they don't have the same member sync semantics)
    if (trackInfo.type === 'virtual') continue;

    const snapshot = await dynamicRepo.getLatestSnapshot(trackInfo.track_id);
    if (!snapshot) continue;

    const isMember = (snapshot.members || []).some((m) => m.object_ref === objectRef);
    const isTracked =
      isMember ||
      (snapshot.candidates || []).some((c) => c.object_ref === objectRef) ||
      (snapshot.staged || []).some((s) => s.object_ref === objectRef);

    if (isTracked) {
      results.push({
        trackId: trackInfo.track_id,
        snapshot,
        isMember,
      });
    }
  }

  return results;
}

// =============================================================================
// Core sync logic
// =============================================================================

/**
 * Process member sync for a single release track.
 *
 * Applies the configured strategy to determine if/how to enroll
 * the new object revision as a candidate.
 *
 * @param {string} trackId - The release track ID
 * @param {Object} snapshot - The current latest snapshot
 * @param {Object} event - The modification event details
 * @param {string} event.objectRef - STIX ID of the modified object
 * @param {Date|string} event.newModified - New modified timestamp
 * @param {string} [event.modifiedBy] - User who made the modification
 * @returns {Promise<Object|null>} New snapshot if changes made, null otherwise
 */
async function processMemberSync(trackId, snapshot, event) {
  const { objectRef, newModified, modifiedBy, isMember } = event;

  // Get member sync config with defaults
  const config = getMemberSyncConfig(snapshot);

  // Check strategy
  if (config.strategy === 'manual') {
    logger.debug(`[member-sync] Track ${trackId} uses manual strategy, skipping auto-enrollment`);
    return null;
  }

  // strategy === 'track_latest'
  // Check if object already exists in candidates or staged
  const existingInCandidates = snapshot.candidates?.find((c) => c.object_ref === objectRef);
  const existingInStaged = snapshot.staged?.find((s) => s.object_ref === objectRef);
  const existingEntry = existingInStaged || existingInCandidates;
  const existingTier = existingInStaged ? 'staged' : existingInCandidates ? 'candidates' : null;

  // Determine action based on supplant.behavior
  let action = null;
  if (!existingEntry) {
    // No candidate/staged entry. Only members enroll new revisions from
    // scratch; a non-member object can only be here via a pin that has
    // since disappeared (snapshot changed between discovery and processing).
    if (!isMember) return null;
    action = { type: 'enroll', tier: 'candidates' };
  } else {
    // Existing entry → apply supplant behavior
    switch (config.supplant.behavior) {
      case 'replace':
        action = {
          type: 'replace',
          removeTier: existingTier,
          removeEntry: existingEntry,
          targetTier: config.supplant.status_policy === 'preserve' ? existingTier : 'candidates',
        };
        break;
      case 'queue':
        action = { type: 'enroll', tier: 'candidates' };
        break;
      case 'ignore':
        logger.debug(
          `[member-sync] Track ${trackId}: ignoring ${objectRef} (existing entry in ${existingTier})`,
        );
        return null;
    }
  }

  if (!action) return null;

  const incomingTime = new Date(newModified).getTime();

  if (action.type === 'enroll') {
    // Skip if this exact revision is already pinned in any tier — enrolling
    // it again would create a duplicate cross-tier reference (e.g. a
    // re-import announcing an already-released revision).
    const alreadyPinned = ['members', 'staged', 'candidates'].some((tier) =>
      (snapshot[tier] || []).some(
        (e) => e.object_ref === objectRef && new Date(e.object_modified).getTime() === incomingTime,
      ),
    );
    if (alreadyPinned) {
      logger.debug(
        `[member-sync] Track ${trackId}: revision ${objectRef} @ ` +
          `${new Date(newModified).toISOString()} is already pinned, skipping enrollment`,
      );
      return null;
    }
  }

  if (action.type === 'replace') {
    // An in-place edit of the pinned revision arrives with the same
    // object_modified: the pin key does not change. Act only when the
    // outcome differs — a reviewed entry resets for re-review, a staged
    // entry demotes back to candidates — otherwise skip instead of cloning
    // a no-op snapshot.
    const existingTime = new Date(action.removeEntry.object_modified).getTime();
    const currentStatus = action.removeEntry.object_status || 'work-in-progress';
    const resultingStatus =
      config.supplant.status_policy === 'preserve' ? currentStatus : 'work-in-progress';
    if (
      existingTime === incomingTime &&
      action.targetTier === existingTier &&
      resultingStatus === currentStatus
    ) {
      logger.debug(
        `[member-sync] Track ${trackId}: in-place update of ${objectRef} leaves the ` +
          `pinned entry unchanged, skipping`,
      );
      return null;
    }
  }

  // Build the new candidate/staged entry
  const now = new Date();
  const newEntry = {
    object_ref: objectRef,
    object_modified: new Date(newModified),
    object_added_at: now,
    object_added_by: modifiedBy || 'system',
  };

  // Determine status and tier placement
  const targetTier = action.targetTier || action.tier;

  if (action.type === 'replace' && config.supplant.status_policy === 'preserve') {
    // Preserve status from old entry
    newEntry.object_status = action.removeEntry.object_status;
    if (targetTier === 'staged') {
      newEntry.object_staged_at = now;
      newEntry.object_staged_by = modifiedBy || 'system';
    }
  } else {
    // Reset status to work-in-progress
    newEntry.object_status = 'work-in-progress';
  }

  // Build updated tier arrays
  let newCandidates = [...(snapshot.candidates || [])];
  let newStaged = [...(snapshot.staged || [])];

  // Remove old entry if replacing
  if (action.type === 'replace') {
    if (action.removeTier === 'candidates') {
      newCandidates = newCandidates.filter(
        (c) =>
          !(
            c.object_ref === objectRef &&
            new Date(c.object_modified).getTime() ===
              new Date(action.removeEntry.object_modified).getTime()
          ),
      );
    } else if (action.removeTier === 'staged') {
      newStaged = newStaged.filter(
        (s) =>
          !(
            s.object_ref === objectRef &&
            new Date(s.object_modified).getTime() ===
              new Date(action.removeEntry.object_modified).getTime()
          ),
      );
    }
  }

  // Add new entry to target tier
  if (targetTier === 'staged') {
    newStaged.push(newEntry);
  } else {
    newCandidates.push(newEntry);
  }

  // Clone snapshot with updated tiers
  const newSnapshot = await snapshotService.cloneSnapshot(trackId, snapshot, {
    candidates: newCandidates,
    staged: newStaged,
  });

  logger.info(`[member-sync] Track ${trackId}: ${action.type} ${objectRef} → ${targetTier}`);

  // Check if auto-promotion should occur (new entry in candidates that meets threshold)
  if (targetTier === 'candidates' && snapshot.config?.auto_promote) {
    const promoted = await workflowService.evaluateAutoPromotion(trackId, newSnapshot);
    if (promoted) {
      logger.info(`[member-sync] Track ${trackId}: auto-promoted ${objectRef} to staged`);
      return promoted;
    }
  }

  return newSnapshot;
}

// =============================================================================
// Configuration helpers
// =============================================================================

/**
 * Get the member sync configuration with defaults applied.
 *
 * @param {Object} snapshot - The snapshot to read config from
 * @returns {Object} Member sync config with defaults
 */
function getMemberSyncConfig(snapshot) {
  const memberSync = snapshot.config?.member_sync || {};

  return {
    strategy: memberSync.strategy || 'track_latest',
    supplant: {
      behavior: memberSync.supplant?.behavior || 'replace',
      status_policy: memberSync.supplant?.status_policy || 'reset',
    },
  };
}

// =============================================================================
// Event Subscription
// =============================================================================

/**
 * All STIX object event names that can trigger member sync.
 * We listen to both ::created and ::updated events for each type.
 */
const STIX_OBJECT_EVENTS = [
  // Core ATT&CK objects
  EventConstants.ATTACK_PATTERN_CREATED,
  EventConstants.ATTACK_PATTERN_UPDATED,
  EventConstants.TACTIC_CREATED,
  EventConstants.TACTIC_UPDATED,
  EventConstants.COURSE_OF_ACTION_CREATED,
  EventConstants.COURSE_OF_ACTION_UPDATED,
  EventConstants.INTRUSION_SET_CREATED,
  EventConstants.INTRUSION_SET_UPDATED,
  EventConstants.MALWARE_CREATED,
  EventConstants.MALWARE_UPDATED,
  EventConstants.TOOL_CREATED,
  EventConstants.TOOL_UPDATED,
  EventConstants.CAMPAIGN_CREATED,
  EventConstants.CAMPAIGN_UPDATED,
  EventConstants.DATA_SOURCE_CREATED,
  EventConstants.DATA_SOURCE_UPDATED,
  EventConstants.DATA_COMPONENT_CREATED,
  EventConstants.DATA_COMPONENT_UPDATED,
  EventConstants.MATRIX_CREATED,
  EventConstants.MATRIX_UPDATED,
  EventConstants.COLLECTION_CREATED,
  EventConstants.COLLECTION_UPDATED,
  EventConstants.ASSET_CREATED,
  EventConstants.ASSET_UPDATED,
  // Detection strategies and analytics
  EventConstants.DETECTION_STRATEGY_CREATED,
  EventConstants.DETECTION_STRATEGY_UPDATED,
  EventConstants.ANALYTIC_CREATED,
  EventConstants.ANALYTIC_UPDATED,
];

/**
 * Handle a STIX object event from BaseService.
 *
 * Transforms the BaseService event payload into the format expected by
 * handleObjectModified and triggers member sync processing.
 *
 * @param {Object} payload - Event payload from BaseService
 * @param {string} payload.stixId - The STIX ID
 * @param {Object} payload.document - The created/updated document
 * @param {Object} [payload.previousDocument] - Previous document (for updates)
 * @param {string} payload.type - The STIX type
 * @param {Object} [payload.options] - Creation options (for created events)
 */
async function handleStixObjectEvent(payload) {
  const { stixId, document, previousDocument, options } = payload;

  // Transform to member sync event format
  const event = {
    objectRef: stixId,
    newModified: document.stix?.modified,
    oldModified: previousDocument?.stix?.modified,
    // Try to get user from options (create) or from document workflow metadata
    modifiedBy:
      options?.userAccountId || document.workspace?.workflow?.created_by_user_account || 'system',
  };

  try {
    await exports.handleObjectModified(event);
  } catch (err) {
    logger.error(`[member-sync] Error handling object modification: ${err.message}`, err);
  }
}

/**
 * All STIX object revoked events. The revoke workflow saves the revoked
 * revision directly via the repository (no ::created/::updated fires), so
 * without this subscription a track would silently keep exporting the
 * pre-revoke revision.
 */
const STIX_OBJECT_REVOKED_EVENTS = [
  EventConstants.ATTACK_PATTERN_REVOKED,
  EventConstants.TACTIC_REVOKED,
  EventConstants.COURSE_OF_ACTION_REVOKED,
  EventConstants.INTRUSION_SET_REVOKED,
  EventConstants.MALWARE_REVOKED,
  EventConstants.TOOL_REVOKED,
  EventConstants.CAMPAIGN_REVOKED,
  EventConstants.DATA_SOURCE_REVOKED,
  EventConstants.DATA_COMPONENT_REVOKED,
  EventConstants.MATRIX_REVOKED,
  EventConstants.ASSET_REVOKED,
];

/**
 * Handle a STIX object revoked event from BaseService.revoke().
 *
 * The revoked payload shape differs from created/updated: the new revision
 * (revoked: true) arrives as payload.revokedDocument. Treat it like any
 * other new revision — enroll it in member tracks, move candidate/staged
 * pins per the supplant config.
 *
 * @param {Object} payload - Event payload from BaseService.revoke()
 * @param {string} payload.stixId - The STIX ID of the revoked object
 * @param {Object} payload.revokedDocument - The new revoked revision
 * @param {Object} [payload.options] - Revocation options
 */
async function handleStixObjectRevokedEvent(payload) {
  const { stixId, revokedDocument, options } = payload;

  const event = {
    objectRef: stixId,
    newModified: revokedDocument?.stix?.modified,
    modifiedBy:
      options?.userAccountId ||
      revokedDocument?.workspace?.workflow?.created_by_user_account ||
      'system',
  };

  try {
    await exports.handleObjectModified(event);
  } catch (err) {
    logger.error(`[member-sync] Error handling object revocation: ${err.message}`, err);
  }
}

/**
 * Initialize event listeners for member sync.
 *
 * Subscribes to all STIX object created/updated/revoked events via the
 * EventBus. Called automatically when this module is loaded.
 */
function initializeEventListeners() {
  for (const eventName of STIX_OBJECT_EVENTS) {
    EventBus.on(eventName, handleStixObjectEvent);
  }
  for (const eventName of STIX_OBJECT_REVOKED_EVENTS) {
    EventBus.on(eventName, handleStixObjectRevokedEvent);
  }

  logger.info(
    `[member-sync] Member sync service initialized, listening to ` +
      `${STIX_OBJECT_EVENTS.length + STIX_OBJECT_REVOKED_EVENTS.length} event types`,
  );
}

// Self-initialize when module is loaded (follows pattern from analytics-service.js)
initializeEventListeners();

// =============================================================================
// Exports for testing
// =============================================================================

// Expose internal functions for unit testing
exports._internal = {
  findTracksReferencingObject,
  processMemberSync,
  getMemberSyncConfig,
  handleStixObjectEvent,
  handleStixObjectRevokedEvent,
  STIX_OBJECT_EVENTS,
  STIX_OBJECT_REVOKED_EVENTS,
};
