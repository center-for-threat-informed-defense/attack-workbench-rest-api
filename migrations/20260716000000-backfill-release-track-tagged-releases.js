'use strict';

/**
 * Backfill the compact tagged-release catalogue in releaseTrackRegistry and
 * create the tagged-members lookup index in every dynamic track collection.
 *
 * Dynamic snapshot collections remain authoritative. The registry projection
 * is rebuilt rather than incrementally patched, making this migration safe to
 * rerun and useful as a repair operation.
 */

const INDEX_NAME = 'tagged_members_object_ref';
const CONCURRENCY = 8;

function compareVersions(left, right) {
  const [leftMajor, leftMinor] = left.split('.').map(Number);
  const [rightMajor, rightMinor] = right.split('.').map(Number);
  if (leftMajor !== rightMajor) return leftMajor - rightMajor;
  return leftMinor - rightMinor;
}

function sameInstant(left, right) {
  return new Date(left).getTime() === new Date(right).getTime();
}

function taggedReleaseFromSnapshot(snapshot) {
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

async function mapWithConcurrency(items, mapper) {
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      await mapper(items[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, () => worker()));
}

module.exports = {
  async up(db) {
    const registry = db.collection('releaseTrackRegistry');
    const tracks = await registry.find({}).project({ track_id: 1 }).toArray();
    let taggedReleaseCount = 0;

    await mapWithConcurrency(tracks, async (track) => {
      const collectionExists = await db
        .listCollections({ name: track.track_id }, { nameOnly: true })
        .hasNext();
      if (!collectionExists) return;

      const snapshots = await db
        .collection(track.track_id)
        .find(
          { version: { $type: 'string' } },
          { projection: { modified: 1, version: 1, version_history: 1 } },
        )
        .sort({ modified: 1 })
        .toArray();
      const taggedReleases = snapshots.map(taggedReleaseFromSnapshot);
      const latestTaggedVersion = taggedReleases.reduce(
        (highest, release) =>
          !highest || compareVersions(release.version, highest) > 0 ? release.version : highest,
        null,
      );

      await registry.updateOne(
        { track_id: track.track_id },
        {
          $set: {
            tagged_releases: taggedReleases,
            tagged_release_count: taggedReleases.length,
            latest_tagged_version: latestTaggedVersion,
            updated_at: new Date(),
          },
        },
      );

      await db.collection(track.track_id).createIndex(
        { 'members.object_ref': 1, modified: -1 },
        {
          name: INDEX_NAME,
          partialFilterExpression: { version: { $type: 'string' } },
        },
      );
      taggedReleaseCount += taggedReleases.length;
    });

    console.log(
      `Backfilled ${taggedReleaseCount} tagged release reference(s) across ${tracks.length} track(s)`,
    );
  },

  async down(db) {
    const registry = db.collection('releaseTrackRegistry');
    const tracks = await registry.find({}).project({ track_id: 1 }).toArray();

    await registry.updateMany({}, { $unset: { tagged_releases: '' } });

    await mapWithConcurrency(tracks, async (track) => {
      const collectionExists = await db
        .listCollections({ name: track.track_id }, { nameOnly: true })
        .hasNext();
      if (!collectionExists) return;

      const indexes = await db.collection(track.track_id).indexes();
      if (indexes.some((index) => index.name === INDEX_NAME)) {
        await db.collection(track.track_id).dropIndex(INDEX_NAME);
      }
    });
  },

  _private: {
    compareVersions,
    taggedReleaseFromSnapshot,
  },
};
