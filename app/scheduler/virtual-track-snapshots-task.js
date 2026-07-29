'use strict';

const mongoose = require('mongoose');
const schedule = require('node-schedule');
const config = require('../config/config');
const logger = require('../lib/logger');
const { createAutomationRunRecorder, serializeError } = require('../lib/automation-run-recorder');
const registryRepo = require('../repository/release-tracks/release-track-registry.repository');
const occurrenceRepo = require('../repository/release-tracks/virtual-track-schedule-occurrence.repository');
const virtualTrackService = require('../services/release-tracks/virtual-track-service');

const TASK_NAME = 'virtual-track-snapshot-materialization';
const JOB_PREFIX = `${TASK_NAME}:`;
const CLAIM_TTL_MS = 5 * 60 * 1000;
const RETRY_DELAY_MS = 60 * 1000;
const cronJobs = new Map();

function scheduledJobName(trackId) {
  return `${JOB_PREFIX}${trackId}`;
}

function isConfiguredOccurrence(track, occurrence) {
  const configured = track?.snapshot_schedule;
  if (!configured || configured.mode !== occurrence.schedule_mode) return false;
  if (configured.mode === 'cron') return true;

  const scheduledTime = new Date(occurrence.scheduled_for).getTime();
  return configured.dates.some((date) => new Date(date).getTime() === scheduledTime);
}

async function auditAttempt(occurrence, execute) {
  const scheduledFor = new Date(occurrence.scheduled_for);
  const db = mongoose.connection.getClient().db();
  const recorder = await createAutomationRunRecorder(db, {
    automationType: 'scheduler',
    name: TASK_NAME,
    trigger: {
      source: 'snapshot_schedule',
      scheduled_for: scheduledFor,
    },
    scope: {
      track_id: occurrence.track_id,
      schedule_mode: occurrence.schedule_mode,
    },
    metadata: {
      attempt: occurrence.attempt_count,
    },
  });

  try {
    const snapshot = await execute();
    await recorder.recordItem({
      status: 'changed',
      action: 'materialize_virtual_snapshot',
      target: {
        kind: 'release-track',
        document_id: occurrence.track_id,
      },
      details: {
        scheduled_for: scheduledFor,
        snapshot_modified: snapshot.modified,
        members_count: snapshot.members?.length || 0,
        quarantine_count: snapshot.quarantine?.length || 0,
      },
    });
    await recorder.finish({
      status: 'completed',
      counts: { materialized: 1, failed: 0 },
      summary: {
        message: `Materialized scheduled virtual snapshot for ${occurrence.track_id}`,
      },
    });
    return snapshot;
  } catch (err) {
    const serialized = serializeError(err);
    await recorder.recordItem({
      status: 'failed',
      action: 'materialize_virtual_snapshot',
      target: {
        kind: 'release-track',
        document_id: occurrence.track_id,
      },
      error: serialized,
      details: { scheduled_for: scheduledFor },
    });
    await recorder.finish({
      status: 'failed',
      counts: { materialized: 0, failed: 1 },
      errorSummary: serialized,
      summary: {
        message: `Scheduled virtual snapshot failed for ${occurrence.track_id}`,
      },
    });
    throw err;
  }
}

async function executeOccurrence(occurrence, now = new Date()) {
  const scheduledFor = new Date(occurrence.scheduled_for);
  const claimed = await occurrenceRepo.claim(
    occurrence.track_id,
    scheduledFor,
    now,
    new Date(now.getTime() + CLAIM_TTL_MS),
  );
  if (!claimed) return null;

  const track = await registryRepo.findByTrackId(claimed.track_id);
  if (!isConfiguredOccurrence(track, claimed)) {
    await occurrenceRepo.skip(
      claimed.track_id,
      scheduledFor,
      'Track was deleted or no longer has the schedule that produced this occurrence',
    );
    return null;
  }

  try {
    const snapshot = await auditAttempt(claimed, () =>
      virtualTrackService.createVirtualSnapshot(claimed.track_id, {
        scheduledMaterialization: {
          schedule_mode: claimed.schedule_mode,
          scheduled_for: scheduledFor,
        },
      }),
    );
    await occurrenceRepo.complete(claimed.track_id, scheduledFor, snapshot.modified);
    return snapshot;
  } catch (err) {
    await occurrenceRepo.fail(
      claimed.track_id,
      scheduledFor,
      serializeError(err),
      new Date(now.getTime() + RETRY_DELAY_MS),
    );
    logger.error(
      `[${TASK_NAME}] ${claimed.track_id} occurrence ${scheduledFor.toISOString()} failed: ${err.message}`,
    );
    return null;
  }
}

async function executeCronOccurrence(trackId, fireDate) {
  const occurrence = await occurrenceRepo.register(trackId, 'cron', fireDate);
  return executeOccurrence(occurrence);
}

async function registerCronTrack(track) {
  const trackId = track.track_id;
  const cronPattern = track.snapshot_schedule.cron;
  const existing = cronJobs.get(trackId);
  if (existing?.cronPattern === cronPattern) return;

  if (existing) {
    schedule.cancelJob(existing.job);
    cronJobs.delete(trackId);
  }

  const job = schedule.scheduleJob(
    scheduledJobName(trackId),
    { rule: cronPattern, tz: 'Etc/UTC' },
    async (fireDate) => {
      try {
        await executeCronOccurrence(trackId, fireDate);
      } catch (err) {
        logger.error(
          `[${TASK_NAME}] Unable to register ${trackId} occurrence ${fireDate.toISOString()}: ${err.message}`,
        );
        logger.error(err.stack);
      }
    },
  );

  if (!job) {
    throw new Error(`Unable to schedule cron expression "${cronPattern}" for ${trackId}`);
  }
  cronJobs.set(trackId, { cronPattern, job });
}

async function reconcileSchedules(now = new Date()) {
  const tracks = await registryRepo.findScheduledVirtualTracks();
  const cronTrackIds = new Set();

  for (const track of tracks) {
    if (track.snapshot_schedule.mode === 'cron') {
      cronTrackIds.add(track.track_id);
      await registerCronTrack(track);
      continue;
    }

    for (const scheduledFor of track.snapshot_schedule.dates) {
      if (new Date(scheduledFor) <= now) {
        await occurrenceRepo.register(track.track_id, 'dates', scheduledFor);
      }
    }
  }

  for (const [trackId, registered] of cronJobs) {
    if (!cronTrackIds.has(trackId)) {
      schedule.cancelJob(registered.job);
      cronJobs.delete(trackId);
    }
  }

  const due = await occurrenceRepo.findDue(now);
  for (const occurrence of due) {
    await executeOccurrence(occurrence, now);
  }

  return {
    scheduled_tracks: tracks.length,
    due_occurrences: due.length,
  };
}

function initializeTask() {
  const cronPattern = config.scheduler.virtualTrackSchedulesCron;
  logger.info(`[${TASK_NAME}] Scheduling reconciliation with cron pattern: ${cronPattern}`);

  schedule.scheduleJob(`${TASK_NAME}:reconcile`, { rule: cronPattern, tz: 'Etc/UTC' }, async () => {
    try {
      await reconcileSchedules();
    } catch (err) {
      logger.error(`[${TASK_NAME}] Reconciliation failed: ${err.message}`);
      logger.error(err.stack);
    }
  });

  reconcileSchedules().catch((err) => {
    logger.error(`[${TASK_NAME}] Startup reconciliation failed: ${err.message}`);
    logger.error(err.stack);
  });
}

if (config.scheduler.enableScheduler) {
  initializeTask();
}

module.exports = {
  executeCronOccurrence,
  executeOccurrence,
  initializeTask,
  reconcileSchedules,
};
