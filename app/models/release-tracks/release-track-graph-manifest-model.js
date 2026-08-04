'use strict';

const mongoose = require('mongoose');

const exactRevisionSchema = new mongoose.Schema(
  {
    object_ref: { type: String, required: true },
    object_modified: { type: Date, required: true },
  },
  { _id: false },
);

const manifestSchema = new mongoose.Schema(
  {
    manifest_id: { type: String, required: true, unique: true },
    track_id: { type: String, required: true },
    snapshot_modified: { type: Date, required: true },
    state: {
      type: String,
      enum: ['pending', 'active'],
      required: true,
      default: 'pending',
    },
    schema_version: { type: Number, required: true, default: 1 },
    resolver_version: { type: String, required: true },
    baseline_reconstruction: { type: Boolean, required: true, default: false },
    created_at: { type: Date, required: true, default: Date.now },
  },
  { collection: 'releaseTrackGraphManifests' },
);

manifestSchema.index(
  { track_id: 1, snapshot_modified: 1, state: 1 },
  { name: 'manifest_by_snapshot' },
);

const entrySchema = new mongoose.Schema(
  {
    manifest_id: { type: String, required: true },
    track_id: { type: String, required: true },
    snapshot_modified: { type: Date, required: true },
    revision_key: { type: String, required: true },
    kind: {
      type: String,
      enum: ['root', 'relationship', 'secondary', 'supporting', 'link_target'],
      required: true,
    },
    tier: {
      type: String,
      enum: ['members', 'staged', 'candidates', 'quarantine'],
    },
    object_status: { type: String },
    object_ref: { type: String, required: true },
    object_modified: { type: Date },
    source: { type: exactRevisionSchema },
    target: { type: exactRevisionSchema },
    discovered_from: { type: [exactRevisionSchema], default: undefined },
    // Schema-v2 relationships are exact-revision pointers. Marking
    // definitions are not STIX-versioned, so their complete payload is frozen
    // for the same replay guarantee. Schema-v1 relationships retain frozen
    // payloads for backwards-compatible replay.
    frozen_stix: { type: mongoose.Schema.Types.Mixed },
  },
  { collection: 'releaseTrackGraphManifestEntries' },
);

entrySchema.index(
  { manifest_id: 1, revision_key: 1, kind: 1, tier: 1 },
  { unique: true, name: 'unique_manifest_entry' },
);
entrySchema.index(
  { object_ref: 1, object_modified: 1, manifest_id: 1 },
  { name: 'manifest_revision_protection' },
);
entrySchema.index({ manifest_id: 1, kind: 1, tier: 1 });

const ReleaseTrackGraphManifest = mongoose.model('ReleaseTrackGraphManifest', manifestSchema);
const ReleaseTrackGraphManifestEntry = mongoose.model(
  'ReleaseTrackGraphManifestEntry',
  entrySchema,
);

module.exports = {
  ReleaseTrackGraphManifest,
  ReleaseTrackGraphManifestEntry,
};
