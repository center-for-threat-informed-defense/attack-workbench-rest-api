'use strict';

const mongoose = require('mongoose');

const exactRevisionSchema = new mongoose.Schema(
  {
    object_ref: { type: String, required: true },
    object_modified: { type: Date, required: true },
  },
  { _id: false },
);

// A content manifest is the sealed bill of materials for one exact member
// set. Snapshots reference it by `manifest_id`; several snapshots may share
// one manifest. See docs/developer/release-tracks/sealed-content-manifests.md.
const manifestSchema = new mongoose.Schema(
  {
    manifest_id: { type: String, required: true, unique: true },
    track_id: { type: String, required: true },
    // The snapshot whose write sealed this manifest (later clones may inherit it).
    snapshot_modified: { type: Date, required: true },
    // `pending` while entries are being written and verified; `active` once a
    // snapshot references it. Both states protect referenced revisions from
    // deletion, so an interrupted seal never leaves an unprotected manifest.
    state: {
      type: String,
      enum: ['pending', 'active'],
      required: true,
      default: 'pending',
    },
    // 1: legacy manifests from the July 2026 backfill whose relationship
    //    entries carry frozen STIX payloads and may include relationship-
    //    discovered `secondary` objects (replayed read-only).
    // 2: pointer-only manifests closed over exact members.
    schema_version: { type: Number, required: true, default: 2 },
    // Which write sealed the manifest.
    seal_reason: {
      type: String,
      required: true,
      enum: [
        'track_creation',
        'members_written',
        'release',
        'materialization',
        'track_clone',
        'source_reconstruction',
        'migration',
        'legacy_graph',
      ],
    },
    // Present only for source_reconstruction: the externally verified bundle
    // an administrator attested the pointers were derived from.
    source_attestation: { type: mongoose.Schema.Types.Mixed },
    created_at: { type: Date, required: true, default: Date.now },
  },
  { collection: 'releaseTrackContentManifests' },
);

manifestSchema.index(
  { track_id: 1, snapshot_modified: 1, state: 1 },
  { name: 'manifest_by_snapshot' },
);

// One entry per exact object revision a manifest emits or depends on.
//   root         a member revision (tier is always `members`)
//   relationship an SRO whose source and target are both members; `source`
//                and `target` record the member revisions it ships with
//   supporting   an identity or marking definition referenced by emitted
//                objects or by the collection object; unversioned marking
//                definitions are frozen by value in `frozen_stix`
//   link_target  a non-emitted object hydrated only to render LinkById tags
//   secondary    legacy (schema 1) relationship-discovered object
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
    object_ref: { type: String, required: true },
    object_modified: { type: Date },
    source: { type: exactRevisionSchema },
    target: { type: exactRevisionSchema },
    // Source-attested serialization hints: false-valued defaults the attested
    // publication omitted.
    omitted_optional_defaults: {
      type: [String],
      enum: ['revoked', 'x_mitre_remote_support'],
      default: undefined,
    },
    // Legacy (schema 1): which member revision discovered a secondary object.
    discovered_from: { type: [exactRevisionSchema], default: undefined },
    frozen_stix: { type: mongoose.Schema.Types.Mixed },
  },
  { collection: 'releaseTrackContentManifestEntries' },
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

const ReleaseTrackContentManifest = mongoose.model('ReleaseTrackContentManifest', manifestSchema);
const ReleaseTrackContentManifestEntry = mongoose.model(
  'ReleaseTrackContentManifestEntry',
  entrySchema,
);

module.exports = {
  ReleaseTrackContentManifest,
  ReleaseTrackContentManifestEntry,
};
