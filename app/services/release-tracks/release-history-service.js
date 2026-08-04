'use strict';

// =============================================================================
// Release History Service
//
// Maintains the compact tagged-release catalogue in releaseTrackRegistry and
// answers global object -> tagged release queries by bounded fan-out across
// the per-track snapshot collections.
// =============================================================================

const dynamicRepo = require('../../repository/release-tracks/release-track-dynamic.repository');
const registryRepo = require('../../repository/release-tracks/release-track-registry.repository');
const versionUtils = require('../../lib/release-tracks/version-utils');

const QUERY_CONCURRENCY = 12;

function sameInstant(left, right) {
  return new Date(left).getTime() === new Date(right).getTime();
}

function tagMetadataForSnapshot(snapshot) {
  const historyEntry = (snapshot.version_history || []).find(
    (entry) =>
      entry.version === snapshot.version && sameInstant(entry.snapshot_id, snapshot.modified),
  );

  return {
    snapshot_modified: snapshot.modified,
    version: snapshot.version,
    tagged_at: historyEntry?.tagged_at || snapshot.modified,
    tagged_by: historyEntry?.tagged_by || 'system',
  };
}

function highestVersion(taggedReleases) {
  let highest = null;
  for (const release of taggedReleases) {
    if (!highest || versionUtils.compareVersions(release.version, highest) > 0) {
      highest = release.version;
    }
  }
  return highest;
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await mapper(items[index], index);
    }
  }

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

exports.getTrackWideVersionHistory = async function getTrackWideVersionHistory(trackId) {
  const snapshots = await dynamicRepo.getTaggedSnapshotMetadata(trackId);
  return snapshots.map((snapshot) => ({
    version: snapshot.version,
    modified: snapshot.modified,
  }));
};

exports.reconcileTaggedReleases = async function reconcileTaggedReleases(trackId) {
  const snapshots = await dynamicRepo.getTaggedSnapshotMetadata(trackId);
  const taggedReleases = snapshots.map(tagMetadataForSnapshot);
  await registryRepo.replaceTaggedReleases(trackId, taggedReleases, highestVersion(taggedReleases));
  return taggedReleases;
};

exports.getReleasesByObject = async function getReleasesByObject(objectRef, options = {}) {
  const tracks = await registryRepo.findWithTaggedReleases({ type: options.type });

  const matchesByTrack = await mapWithConcurrency(tracks, QUERY_CONCURRENCY, async (track) => {
    const releaseByModified = new Map(
      track.tagged_releases.map((release) => [
        new Date(release.snapshot_modified).toISOString(),
        release,
      ]),
    );
    const snapshots = await dynamicRepo.findTaggedSnapshotsContainingObject(
      track.track_id,
      track.tagged_releases.map((release) => release.snapshot_modified),
      objectRef,
    );

    return snapshots.map((snapshot) => {
      const release = releaseByModified.get(new Date(snapshot.modified).toISOString());
      const member = snapshot.members[0];
      return {
        track_id: track.track_id,
        track_type: snapshot.type || track.type,
        track_name: snapshot.name || track.name,
        version: snapshot.version,
        snapshot_modified: snapshot.modified,
        tagged_at: release.tagged_at,
        tagged_by: release.tagged_by,
        object_modified: member.object_modified,
      };
    });
  });

  const direction = options.order === 'desc' ? -1 : 1;
  const data = matchesByTrack.flat().sort((left, right) => {
    const timeComparison =
      new Date(left.snapshot_modified).getTime() - new Date(right.snapshot_modified).getTime();
    if (timeComparison !== 0) return timeComparison * direction;
    const trackComparison = left.track_id.localeCompare(right.track_id);
    if (trackComparison !== 0) return trackComparison;
    return versionUtils.compareVersions(left.version, right.version) * direction;
  });

  const offset = options.offset || 0;
  const limit = options.limit || 50;

  return {
    object_ref: objectRef,
    data: data.slice(offset, offset + limit),
    pagination: {
      total: data.length,
      limit,
      offset,
    },
  };
};

exports._private = {
  highestVersion,
  mapWithConcurrency,
  tagMetadataForSnapshot,
};
