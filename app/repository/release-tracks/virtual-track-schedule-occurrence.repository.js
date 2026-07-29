'use strict';

const VirtualTrackScheduleOccurrence = require('../../models/release-tracks/virtual-track-schedule-occurrence-model');
const { DatabaseError } = require('../../exceptions');

class VirtualTrackScheduleOccurrenceRepository {
  async register(trackId, scheduleMode, scheduledFor) {
    try {
      return await VirtualTrackScheduleOccurrence.findOneAndUpdate(
        { track_id: trackId, scheduled_for: scheduledFor },
        {
          $setOnInsert: {
            track_id: trackId,
            schedule_mode: scheduleMode,
            scheduled_for: scheduledFor,
            status: 'pending',
            attempt_count: 0,
          },
        },
        { upsert: true, new: true, lean: true },
      ).exec();
    } catch (err) {
      throw new DatabaseError(err);
    }
  }

  async findDue(now) {
    try {
      return await VirtualTrackScheduleOccurrence.find({
        $or: [
          { status: 'pending' },
          { status: 'failed', next_retry_at: { $lte: now } },
          { status: 'running', claim_expires_at: { $lte: now } },
        ],
      })
        .sort({ scheduled_for: 1, track_id: 1 })
        .lean()
        .exec();
    } catch (err) {
      throw new DatabaseError(err);
    }
  }

  async claim(trackId, scheduledFor, now, claimExpiresAt) {
    try {
      return await VirtualTrackScheduleOccurrence.findOneAndUpdate(
        {
          track_id: trackId,
          scheduled_for: scheduledFor,
          $or: [
            { status: 'pending' },
            { status: 'failed', next_retry_at: { $lte: now } },
            { status: 'running', claim_expires_at: { $lte: now } },
          ],
        },
        {
          $set: {
            status: 'running',
            claimed_at: now,
            claim_expires_at: claimExpiresAt,
            next_retry_at: null,
            finished_at: null,
            last_error: null,
          },
          $inc: { attempt_count: 1 },
        },
        { new: true, lean: true },
      ).exec();
    } catch (err) {
      throw new DatabaseError(err);
    }
  }

  async complete(trackId, scheduledFor, snapshotModified) {
    return this._finish(trackId, scheduledFor, {
      status: 'completed',
      snapshot_modified: snapshotModified,
      finished_at: new Date(),
      claim_expires_at: null,
      next_retry_at: null,
      last_error: null,
    });
  }

  async fail(trackId, scheduledFor, error, nextRetryAt) {
    return this._finish(trackId, scheduledFor, {
      status: 'failed',
      finished_at: new Date(),
      claim_expires_at: null,
      next_retry_at: nextRetryAt,
      last_error: error,
    });
  }

  async skip(trackId, scheduledFor, reason) {
    return this._finish(trackId, scheduledFor, {
      status: 'skipped',
      finished_at: new Date(),
      claim_expires_at: null,
      next_retry_at: null,
      last_error: { message: reason },
    });
  }

  async _finish(trackId, scheduledFor, updates) {
    try {
      return await VirtualTrackScheduleOccurrence.findOneAndUpdate(
        { track_id: trackId, scheduled_for: scheduledFor },
        { $set: updates },
        { new: true, lean: true },
      ).exec();
    } catch (err) {
      throw new DatabaseError(err);
    }
  }
}

module.exports = new VirtualTrackScheduleOccurrenceRepository();
