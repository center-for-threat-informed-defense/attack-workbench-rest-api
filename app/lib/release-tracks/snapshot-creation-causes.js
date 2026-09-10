'use strict';

// The operation that persisted this snapshot, not the operation that tagged it.
// Unknown is reserved for historical documents and low-level callers without provenance.
module.exports = Object.freeze({
  Unknown: 'unknown',
  TrackCreated: 'track_created',
  ReleaseTagged: 'release_tagged',
  TrackCloned: 'track_cloned',
  BundleImported: 'bundle_imported',
  MetadataUpdated: 'metadata_updated',
  ConfigurationUpdated: 'configuration_updated',
  CandidatesAdded: 'candidates_added',
  CandidateRemoved: 'candidate_removed',
  CandidatesReviewed: 'candidates_reviewed',
  CandidatesPromoted: 'candidates_promoted',
  CandidateVersionUpdated: 'candidate_version_updated',
  StagedDemoted: 'staged_demoted',
  CandidatesAutoPromoted: 'candidates_auto_promoted',
  MemberSynced: 'member_synced',
  CompositionUpdated: 'composition_updated',
  ManualSnapshot: 'manual_snapshot',
  ScheduledSnapshot: 'scheduled_snapshot',
  QuarantinePromoted: 'quarantine_promoted',
});
