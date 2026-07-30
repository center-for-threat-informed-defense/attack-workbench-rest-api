'use strict';

/**
 * Replace the legacy non-unique (id, version) index in every dynamic release
 * track collection with a unique partial index over tagged snapshots.
 *
 * The migration preflights every collection before changing any indexes. If a
 * deployment already contains duplicate tagged versions, migration stops and
 * reports every offending track/version so an operator can repair the data
 * deliberately.
 */

const INDEX_NAME = 'unique_tagged_version';
const LEGACY_INDEX_NAME = 'id_1_version_1';
const CONCURRENCY = 8;
const TRACK_COLLECTION_PATTERN =
  /^release-track--[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

async function collectionExists(db, trackId) {
  return db.listCollections({ name: trackId }, { nameOnly: true }).hasNext();
}

async function findTrackCollectionIds(db) {
  const [registeredTracks, collections] = await Promise.all([
    db.collection('releaseTrackRegistry').find({}).project({ track_id: 1, _id: 0 }).toArray(),
    db.listCollections({}, { nameOnly: true }).toArray(),
  ]);

  return Array.from(
    new Set([
      ...registeredTracks.map((track) => track.track_id),
      ...collections
        .map((collection) => collection.name)
        .filter((name) => TRACK_COLLECTION_PATTERN.test(name)),
    ]),
  ).sort();
}

async function findDuplicateVersions(db, trackIds) {
  const duplicates = [];

  await mapWithConcurrency(trackIds, async (trackId) => {
    if (!(await collectionExists(db, trackId))) return;

    const matches = await db
      .collection(trackId)
      .aggregate([
        { $match: { version: { $type: 'string' } } },
        {
          $group: {
            _id: { id: '$id', version: '$version' },
            count: { $sum: 1 },
            snapshots: { $push: '$modified' },
          },
        },
        { $match: { count: { $gt: 1 } } },
        { $sort: { '_id.version': 1 } },
      ])
      .toArray();

    for (const match of matches) {
      duplicates.push({
        track_id: trackId,
        version: match._id.version,
        snapshots: match.snapshots,
      });
    }
  });

  return duplicates.sort(
    (left, right) =>
      left.track_id.localeCompare(right.track_id) || left.version.localeCompare(right.version),
  );
}

function isDesiredIndex(index) {
  return (
    index?.name === INDEX_NAME &&
    index.unique === true &&
    index.key?.id === 1 &&
    index.key?.version === 1 &&
    index.partialFilterExpression?.version?.$type === 'string'
  );
}

async function installUniqueIndex(db, trackId) {
  if (!(await collectionExists(db, trackId))) return;

  const collection = db.collection(trackId);
  const indexes = await collection.indexes();
  const desired = indexes.find((index) => index.name === INDEX_NAME);
  if (isDesiredIndex(desired)) {
    if (indexes.some((index) => index.name === LEGACY_INDEX_NAME)) {
      await collection.dropIndex(LEGACY_INDEX_NAME);
    }
    return;
  }

  if (desired) await collection.dropIndex(INDEX_NAME);
  if (indexes.some((index) => index.name === LEGACY_INDEX_NAME)) {
    await collection.dropIndex(LEGACY_INDEX_NAME);
  }

  await collection.createIndex(
    { id: 1, version: 1 },
    {
      name: INDEX_NAME,
      unique: true,
      partialFilterExpression: { version: { $type: 'string' } },
    },
  );
}

module.exports = {
  async up(db) {
    const trackIds = await findTrackCollectionIds(db);
    const duplicates = await findDuplicateVersions(db, trackIds);

    if (duplicates.length > 0) {
      const summary = duplicates
        .map(
          (duplicate) =>
            `${duplicate.track_id} version ${duplicate.version} ` +
            `(${duplicate.snapshots.length} snapshots)`,
        )
        .join('; ');
      const error = new Error(
        `Duplicate tagged release versions detected; repair them before retrying migration: ${summary}`,
      );
      error.duplicates = duplicates;
      throw error;
    }

    await mapWithConcurrency(trackIds, (trackId) => installUniqueIndex(db, trackId));
  },

  async down(db) {
    const trackIds = await findTrackCollectionIds(db);

    await mapWithConcurrency(trackIds, async (trackId) => {
      if (!(await collectionExists(db, trackId))) return;

      const collection = db.collection(trackId);
      const indexes = await collection.indexes();
      if (indexes.some((index) => index.name === INDEX_NAME)) {
        await collection.dropIndex(INDEX_NAME);
      }
      if (!indexes.some((index) => index.name === LEGACY_INDEX_NAME)) {
        await collection.createIndex({ id: 1, version: 1 }, { name: LEGACY_INDEX_NAME });
      }
    });
  },

  _private: {
    findTrackCollectionIds,
    findDuplicateVersions,
    installUniqueIndex,
    isDesiredIndex,
  },
};
