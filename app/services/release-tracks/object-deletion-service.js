'use strict';

const EventBus = require('../../lib/event-bus');
const Events = require('../../lib/event-constants');
const graphWriteLock = require('../../lib/graph-write-lock');
const revisionReference = require('../../lib/release-tracks/revision-reference');
const registryRepo = require('../../repository/release-tracks/release-track-registry.repository');
const dynamicRepo = require('../../repository/release-tracks/release-track-dynamic.repository');
const reconciliationService = require('./reconciliation-service');

const WORKFLOW_TIERS = ['candidates', 'staged', 'quarantine'];

async function prepareDeletion({
  stixId,
  stixModified,
  hasSurvivingVersions,
  backrefTrackIds = [],
}) {
  if (!graphWriteLock.isHeld()) {
    return graphWriteLock.run(() =>
      prepareDeletion({ stixId, stixModified, hasSurvivingVersions, backrefTrackIds }),
    );
  }

  const dynamicLatestTrackIds = [];
  const backrefTracks = new Set(backrefTrackIds);
  let afterTrackId;
  for (;;) {
    const tracks = await registryRepo.findTrackBatch(afterTrackId);
    if (tracks.length === 0) break;

    for (const { track_id: trackId } of tracks) {
      const result = await dynamicRepo.removeWorkflowObjectReferences(
        trackId,
        stixId,
        stixModified,
        hasSurvivingVersions,
      );
      const removedReferences = result.modifiedCount > 0;
      if (!removedReferences && !backrefTracks.has(trackId) && !hasSurvivingVersions) {
        continue;
      }
      const snapshot = await dynamicRepo.getLatestSnapshot(trackId);
      const retainsLatest =
        hasSurvivingVersions &&
        WORKFLOW_TIERS.some((tier) =>
          (snapshot?.[tier] || []).some(
            (entry) =>
              entry.object_ref === stixId && revisionReference.isLatest(entry.object_modified),
          ),
        );
      // Stale backrefs identify retries whose snapshot cleanup already landed.
      // Do not turn object deletion into an unrelated full-registry repair.
      if (removedReferences || backrefTracks.has(trackId) || retainsLatest) {
        await reconciliationService.reconcileContentsChanged(trackId, snapshot);
      }
      if (retainsLatest) dynamicLatestTrackIds.push(trackId);
    }
    afterTrackId = tracks[tracks.length - 1].track_id;
  }
  return { dynamicLatestTrackIds };
}

async function completeDeletion({ trackIds }) {
  if (!graphWriteLock.isHeld()) {
    return graphWriteLock.run(() => completeDeletion({ trackIds }));
  }
  for (const trackId of trackIds) {
    const snapshot = await dynamicRepo.getLatestSnapshot(trackId);
    // The deleted revision no longer resolves as latest. Reuse the durable
    // reconciliation workflow so failures are visible and repairable.
    await reconciliationService.reconcileContentsChanged(trackId, snapshot);
  }
}

EventBus.on(Events.RELEASE_TRACK_OBJECT_DELETION_REQUESTED, prepareDeletion);
EventBus.on(Events.RELEASE_TRACK_OBJECT_DELETION_COMPLETED, completeDeletion);

module.exports = { prepareDeletion, completeDeletion };
