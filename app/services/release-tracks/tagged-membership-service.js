'use strict';

// Authoritative tagged-membership reads used by object mutation guards.
// workspace.release_tracks remains a useful denormalized current-snapshot
// pointer, but it is not authoritative for historical tagged releases and may
// be temporarily stale when reconciliation needs repair.

const registryRepo = require('../../repository/release-tracks/release-track-registry.repository');
const dynamicRepo = require('../../repository/release-tracks/release-track-dynamic.repository');

const QUERY_CONCURRENCY = 12;

async function mapWithConcurrency(items, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(QUERY_CONCURRENCY, items.length) }, () => worker()),
  );
  return results;
}

function pinFromSnapshot(snapshot) {
  const member = snapshot.members[0];
  return {
    track_id: snapshot.id,
    track_type: snapshot.type,
    track_name: snapshot.name,
    version: snapshot.version,
    snapshot_modified: snapshot.modified,
    object_ref: member.object_ref,
    object_modified: member.object_modified,
  };
}

async function findPins(objectRef, objectModified) {
  const tracks = (await registryRepo.findAll()).data;
  const matchesByTrack = await mapWithConcurrency(tracks, async (track) => {
    const snapshots = await dynamicRepo.findTaggedSnapshotsContainingRevision(
      track.track_id,
      objectRef,
      objectModified,
    );
    return snapshots.map(pinFromSnapshot);
  });

  return matchesByTrack.flat();
}

exports.findPinsForRevision = function findPinsForRevision(objectRef, objectModified) {
  return findPins(objectRef, objectModified);
};

exports.findPinsForObject = function findPinsForObject(objectRef) {
  return findPins(objectRef);
};

exports._private = {
  mapWithConcurrency,
  pinFromSnapshot,
};
