'use strict';

const { expect } = require('expect');
const mongoose = require('mongoose');
const schedule = require('node-schedule');

const config = require('../../config/config');
const database = require('../../lib/database-in-memory');
const databaseConfiguration = require('../../lib/database-configuration');
const ReleaseTrackRegistry = require('../../models/release-tracks/release-track-registry-model');
const VirtualTrackScheduleOccurrence = require('../../models/release-tracks/virtual-track-schedule-occurrence-model');
const dynamicRepo = require('../../repository/release-tracks/release-track-dynamic.repository');
const releaseTracksService = require('../../services/release-tracks/release-tracks-service');

describe('Scheduled virtual release-track materialization', function () {
  let task;
  let sequence = 0;

  before(async function () {
    config.scheduler.enableScheduler = false;
    await database.initializeConnection();
    await databaseConfiguration.checkSystemConfiguration();
    task = require('../../scheduler/virtual-track-snapshots-task');
  });

  after(async function () {
    await schedule.gracefulShutdown();
    await database.closeConnection();
  });

  async function createComponent({ released = true } = {}) {
    sequence += 1;
    const component = await releaseTracksService.createTrack({
      name: `Scheduled Component ${sequence}`,
      type: 'standard',
    });
    if (released) {
      await releaseTracksService.releaseLatest(component.id, {
        version: '1.0',
        userAccountId: 'scheduler-test',
      });
    }
    return component;
  }

  async function createVirtual(componentId, snapshotSchedule) {
    sequence += 1;
    return releaseTracksService.createTrack({
      name: `Scheduled Virtual ${sequence}`,
      type: 'virtual',
      composition: {
        component_tracks: [
          {
            track_id: componentId,
            resolution_strategy: 'latest_tagged',
            priority: 1,
          },
        ],
      },
      snapshot_schedule: snapshotSchedule,
    });
  }

  async function snapshotCount(trackId) {
    return (await dynamicRepo.getAllSnapshots(trackId)).pagination.total;
  }

  it('recovers missed dates exactly once and records the automation run', async function () {
    const component = await createComponent();
    const scheduledFor = new Date('2026-01-15T12:00:00.000Z');
    const virtual = await createVirtual(component.id, {
      mode: 'dates',
      dates: [scheduledFor.toISOString()],
    });
    const now = new Date('2026-01-15T12:05:00.000Z');

    await task.reconcileSchedules(now);

    expect(await snapshotCount(virtual.id)).toBe(2);
    const materialized = await dynamicRepo.getSnapshotByScheduledMaterialization(
      virtual.id,
      scheduledFor,
    );
    expect(materialized).toMatchObject({
      type: 'virtual',
      scheduled_materialization: {
        schedule_mode: 'dates',
        scheduled_for: scheduledFor,
      },
    });

    const occurrence = await VirtualTrackScheduleOccurrence.findOne({
      track_id: virtual.id,
      scheduled_for: scheduledFor,
    })
      .lean()
      .exec();
    expect(occurrence).toMatchObject({
      status: 'completed',
      attempt_count: 1,
      snapshot_modified: materialized.modified,
    });

    const automationRun = await mongoose.connection
      .getClient()
      .db()
      .collection('automationRuns')
      .findOne({ 'scope.track_id': virtual.id });
    expect(automationRun).toMatchObject({
      automation_type: 'scheduler',
      name: 'virtual-track-snapshot-materialization',
      status: 'completed',
      counts: { materialized: 1, failed: 0 },
    });

    await task.reconcileSchedules(new Date('2026-01-15T12:10:00.000Z'));
    expect(await snapshotCount(virtual.id)).toBe(2);
    expect(
      await mongoose.connection
        .getClient()
        .db()
        .collection('automationRuns')
        .countDocuments({ 'scope.track_id': virtual.id }),
    ).toBe(1);

    const manual = await releaseTracksService.createVirtualSnapshot(virtual.id);
    expect(manual).not.toHaveProperty('scheduled_materialization');
    expect(await snapshotCount(virtual.id)).toBe(3);
  });

  it('materializes duplicate cron delivery once', async function () {
    const component = await createComponent();
    const virtual = await createVirtual(component.id, {
      mode: 'cron',
      cron: '0 0 1 1,7 *',
    });
    const scheduledFor = new Date('2026-07-01T00:00:00.000Z');

    await Promise.all([
      task.executeCronOccurrence(virtual.id, scheduledFor),
      task.executeCronOccurrence(virtual.id, scheduledFor),
    ]);

    expect(await snapshotCount(virtual.id)).toBe(2);
    expect(
      await VirtualTrackScheduleOccurrence.countDocuments({
        track_id: virtual.id,
        scheduled_for: scheduledFor,
        status: 'completed',
      }),
    ).toBe(1);
  });

  it('audits component failures and retries them during reconciliation', async function () {
    const component = await createComponent({ released: false });
    const scheduledFor = new Date('2026-02-01T00:00:00.000Z');
    const virtual = await createVirtual(component.id, {
      mode: 'dates',
      dates: [scheduledFor.toISOString()],
    });
    const firstAttempt = new Date('2026-02-01T00:01:00.000Z');

    await task.reconcileSchedules(firstAttempt);

    let occurrence = await VirtualTrackScheduleOccurrence.findOne({
      track_id: virtual.id,
      scheduled_for: scheduledFor,
    })
      .lean()
      .exec();
    expect(occurrence).toMatchObject({
      status: 'failed',
      attempt_count: 1,
    });
    expect(occurrence.last_error.message).toContain('has no tagged snapshots');
    expect(await snapshotCount(virtual.id)).toBe(1);

    await releaseTracksService.releaseLatest(component.id, {
      version: '1.0',
      userAccountId: 'scheduler-test',
    });
    await task.reconcileSchedules(new Date(firstAttempt.getTime() + 60 * 1000));

    occurrence = await VirtualTrackScheduleOccurrence.findOne({
      track_id: virtual.id,
      scheduled_for: scheduledFor,
    })
      .lean()
      .exec();
    expect(occurrence).toMatchObject({
      status: 'completed',
      attempt_count: 2,
    });
    expect(await snapshotCount(virtual.id)).toBe(2);

    const runs = await mongoose.connection
      .getClient()
      .db()
      .collection('automationRuns')
      .find({ 'scope.track_id': virtual.id })
      .sort({ started_at: 1 })
      .toArray();
    expect(runs.map((run) => run.status)).toEqual(['failed', 'completed']);
  });

  it('does not schedule or materialize manual tracks', async function () {
    const component = await createComponent();
    const virtual = await createVirtual(component.id, { mode: 'manual' });

    await task.reconcileSchedules(new Date('2027-01-01T00:00:00.000Z'));

    expect(await snapshotCount(virtual.id)).toBe(1);
    expect(await VirtualTrackScheduleOccurrence.countDocuments({ track_id: virtual.id })).toBe(0);
    expect(
      await ReleaseTrackRegistry.findOne({ track_id: virtual.id }).lean().exec(),
    ).toMatchObject({
      snapshot_schedule: { mode: 'manual' },
    });
  });
});
