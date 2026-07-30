'use strict';

// Durable orchestration for workspace.release_tracks reconciliation. Each
// attempt is persisted before required EventBus listeners run. Repair always
// reconciles against the track's current latest snapshot, so replay is
// idempotent and cannot restore obsolete membership from an old event.

const EventBus = require('../../lib/event-bus');
const Events = require('../../lib/event-constants');
const logger = require('../../lib/logger');
const dynamicRepo = require('../../repository/release-tracks/release-track-dynamic.repository');
const registryRepo = require('../../repository/release-tracks/release-track-registry.repository');
const reconciliationRepo = require('../../repository/release-tracks/release-track-reconciliation.repository');
const attackObjectsRepo = require('../../repository/attack-objects-repository');
const relationshipsRepo = require('../../repository/relationships-repository');
const { ReleaseTrackReconciliationError } = require('../../exceptions');

// Reconciliation is also invoked by scheduler/migration tests and operator
// scripts that call the service facade without initializing Express. Loading
// both owning services guarantees the two required listeners are registered.
require('../stix/attack-objects-service');
require('../stix/relationships-service');

async function dispatch(record, snapshot) {
  await reconciliationRepo.startAttempt(record.reconciliation_id);

  try {
    await EventBus.emitRequired(
      Events.RELEASE_TRACK_CONTENTS_CHANGED,
      {
        trackId: record.track_id,
        snapshot,
        reconciliationId: record.reconciliation_id,
      },
      { minimumListeners: 2 },
    );
    return await reconciliationRepo.complete(record.reconciliation_id, snapshot?.modified);
  } catch (error) {
    try {
      await reconciliationRepo.fail(record.reconciliation_id, error);
    } catch (recordError) {
      logger.error(
        `ReconciliationService: Failed to record reconciliation ${record.reconciliation_id} ` +
          `failure: ${recordError.message}`,
      );
    }

    throw new ReleaseTrackReconciliationError(record.track_id, record.reconciliation_id, {
      details:
        'The release-track change was persisted, but one or more object backref protections ' +
        'failed. Run the release-track reconciliation repair command before retrying.',
      cause: error,
    });
  }
}

async function currentSnapshot(trackId) {
  const registry = await registryRepo.findByTrackId(trackId);
  return registry ? dynamicRepo.getLatestSnapshot(trackId) : null;
}

async function createAndDispatch(trackId, snapshot, source) {
  const record = await reconciliationRepo.create({
    trackId,
    snapshotModified: snapshot?.modified,
    source,
  });
  return dispatch(record, snapshot);
}

exports.reconcileContentsChanged = function reconcileContentsChanged(trackId, snapshot) {
  return createAndDispatch(trackId, snapshot, 'contents_changed');
};

exports.repairOutstanding = async function repairOutstanding(options = {}) {
  const records = await reconciliationRepo.findRepairable(options.limit || 100);
  const results = [];

  for (const record of records) {
    try {
      const snapshot = await currentSnapshot(record.track_id);
      const completed = await dispatch(record, snapshot);
      results.push({
        reconciliation_id: record.reconciliation_id,
        track_id: record.track_id,
        status: completed.status,
      });
    } catch (error) {
      results.push({
        reconciliation_id: record.reconciliation_id,
        track_id: record.track_id,
        status: 'failed',
        error: error.message,
      });
      if (!options.continueOnError) throw error;
    }
  }

  return results;
};

exports.reconcileAll = async function reconcileAll(options = {}) {
  const [registered, attackObjectTrackIds, relationshipTrackIds] = await Promise.all([
    registryRepo.findAll(),
    attackObjectsRepo.distinctReleaseTrackIds(),
    relationshipsRepo.distinctReleaseTrackIds(),
  ]);
  const trackIds = [
    ...new Set([
      ...registered.data.map((track) => track.track_id),
      ...attackObjectTrackIds,
      ...relationshipTrackIds,
    ]),
  ].sort();
  const results = [];

  for (const trackId of trackIds) {
    try {
      const snapshot = await currentSnapshot(trackId);
      const completed = await createAndDispatch(trackId, snapshot, 'full_scan');
      results.push({
        reconciliation_id: completed.reconciliation_id,
        track_id: trackId,
        status: completed.status,
      });
    } catch (error) {
      results.push({ track_id: trackId, status: 'failed', error: error.message });
      if (!options.continueOnError) throw error;
    }
  }

  return results;
};

exports._private = {
  createAndDispatch,
  currentSnapshot,
  dispatch,
};
