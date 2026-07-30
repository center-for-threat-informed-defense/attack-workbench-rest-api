'use strict';

const { v4: uuidv4 } = require('uuid');
const ReleaseTrackReconciliation = require('../../models/release-tracks/release-track-reconciliation-model');
const { DatabaseError } = require('../../exceptions');

class ReleaseTrackReconciliationRepository {
  async create({ trackId, snapshotModified, source }) {
    const now = new Date();
    try {
      const record = await ReleaseTrackReconciliation.create({
        reconciliation_id: uuidv4(),
        track_id: trackId,
        requested_snapshot_modified: snapshotModified || null,
        source,
        status: 'pending',
        attempts: 0,
        created_at: now,
        updated_at: now,
      });
      return record.toObject();
    } catch (error) {
      throw new DatabaseError(error);
    }
  }

  async startAttempt(reconciliationId) {
    try {
      return await ReleaseTrackReconciliation.findOneAndUpdate(
        { reconciliation_id: reconciliationId },
        {
          $inc: { attempts: 1 },
          $set: {
            status: 'pending',
            updated_at: new Date(),
            completed_at: null,
            last_error: null,
          },
        },
        { new: true, lean: true },
      ).exec();
    } catch (error) {
      throw new DatabaseError(error);
    }
  }

  async complete(reconciliationId, snapshotModified) {
    const now = new Date();
    try {
      return await ReleaseTrackReconciliation.findOneAndUpdate(
        { reconciliation_id: reconciliationId },
        {
          $set: {
            status: 'completed',
            reconciled_snapshot_modified: snapshotModified || null,
            updated_at: now,
            completed_at: now,
            last_error: null,
          },
        },
        { new: true, lean: true },
      ).exec();
    } catch (error) {
      throw new DatabaseError(error);
    }
  }

  async fail(reconciliationId, error) {
    try {
      return await ReleaseTrackReconciliation.findOneAndUpdate(
        { reconciliation_id: reconciliationId },
        {
          $set: {
            status: 'failed',
            updated_at: new Date(),
            completed_at: null,
            last_error: {
              name: error?.name || 'Error',
              message: error?.message || String(error),
            },
          },
        },
        { new: true, lean: true },
      ).exec();
    } catch (repositoryError) {
      throw new DatabaseError(repositoryError);
    }
  }

  async findRepairable(limit = 100) {
    try {
      return await ReleaseTrackReconciliation.find({
        status: { $in: ['pending', 'failed'] },
      })
        .sort({ updated_at: 1, created_at: 1 })
        .limit(limit)
        .lean()
        .exec();
    } catch (error) {
      throw new DatabaseError(error);
    }
  }
}

module.exports = new ReleaseTrackReconciliationRepository();
