'use strict';

const mongoose = require('mongoose');
const { validateTrackId } = require('../../lib/release-tracks/release-track-validators');

const releaseTrackReconciliationSchema = new mongoose.Schema(
  {
    reconciliation_id: {
      type: String,
      required: true,
      unique: true,
    },
    track_id: {
      type: String,
      required: true,
      validate: validateTrackId,
    },
    requested_snapshot_modified: {
      type: Date,
      default: null,
    },
    reconciled_snapshot_modified: {
      type: Date,
      default: null,
    },
    source: {
      type: String,
      required: true,
      enum: ['contents_changed', 'repair', 'full_scan'],
    },
    // Only outstanding work is stored: a record is created before the
    // backref listeners run and deleted when they succeed, so every document
    // in this collection is a reconciliation that still needs repair.
    status: {
      type: String,
      required: true,
      enum: ['pending', 'failed'],
      default: 'pending',
    },
    attempts: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    created_at: {
      type: Date,
      required: true,
    },
    updated_at: {
      type: Date,
      required: true,
    },
    completed_at: {
      type: Date,
      default: null,
    },
    last_error: {
      name: String,
      message: String,
    },
  },
  {
    collection: 'releaseTrackReconciliations',
    bufferCommands: false,
  },
);

releaseTrackReconciliationSchema.index({ status: 1, updated_at: 1 });
releaseTrackReconciliationSchema.index({ track_id: 1, created_at: -1 });

module.exports = mongoose.model('ReleaseTrackReconciliation', releaseTrackReconciliationSchema);
