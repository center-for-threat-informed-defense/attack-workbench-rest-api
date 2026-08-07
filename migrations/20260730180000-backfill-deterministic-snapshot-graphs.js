'use strict';

/**
 * Backfill exact endpoint revision pins on the latest revision of each
 * relationship, then reconstruct a baseline graph manifest for every
 * pre-existing release-track snapshot.
 *
 * Historical relationships cannot be reconstructed truthfully because their
 * endpoint revision was not recorded when they were created. Snapshot
 * manifests produced here are therefore explicitly marked as baseline
 * reconstructions of the graph visible at migration time.
 */

const TRACK_COLLECTION_PATTERN =
  /^release-track--[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CONCURRENCY = 4;
const ACTIVE_RELATIONSHIP_FILTER = {
  'stix.x_mitre_deprecated': { $in: [null, false] },
  'stix.revoked': { $in: [null, false] },
};
const ERROR_SAMPLE_LIMIT = 10;

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

async function latestRelationships(db) {
  const latestActiveViewExists = await db
    .listCollections({ name: 'view.relationships.latest.active' }, { nameOnly: true })
    .hasNext();
  if (latestActiveViewExists) {
    return db.collection('view.relationships.latest.active').find({}).toArray();
  }

  const latestViewExists = await db
    .listCollections({ name: 'view.relationships.latest' }, { nameOnly: true })
    .hasNext();
  if (latestViewExists) {
    return db.collection('view.relationships.latest').find(ACTIVE_RELATIONSHIP_FILTER).toArray();
  }

  return db
    .collection('relationships')
    .aggregate([
      { $sort: { 'stix.id': 1, 'stix.modified': -1 } },
      { $group: { _id: '$stix.id', document: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$document' } },
      { $match: ACTIVE_RELATIONSHIP_FILTER },
    ])
    .toArray();
}

async function latestEndpoint(db, objectRef) {
  return db
    .collection('attackObjects')
    .findOne(
      { 'stix.id': objectRef },
      { projection: { 'stix.id': 1, 'stix.modified': 1 }, sort: { 'stix.modified': -1 } },
    );
}

async function buildRelationshipPinOperations(db) {
  const relationships = await latestRelationships(db);
  const endpointCache = new Map();
  const missing = [];
  const operations = [];

  async function endpoint(objectRef) {
    if (!endpointCache.has(objectRef)) {
      endpointCache.set(objectRef, await latestEndpoint(db, objectRef));
    }
    return endpointCache.get(objectRef);
  }

  for (const relationship of relationships) {
    const [source, target] = await Promise.all([
      endpoint(relationship.stix.source_ref),
      endpoint(relationship.stix.target_ref),
    ]);
    if (!source || !target) {
      missing.push({
        relationship_ref: relationship.stix.id,
        relationship_modified: relationship.stix.modified,
        missing_endpoints: [
          ...(!source ? [relationship.stix.source_ref] : []),
          ...(!target ? [relationship.stix.target_ref] : []),
        ],
      });
      continue;
    }

    operations.push({
      updateOne: {
        filter: { _id: relationship._id },
        update: {
          $set: {
            'workspace.relationship_endpoints': {
              source: {
                object_ref: source.stix.id,
                object_modified: source.stix.modified,
              },
              target: {
                object_ref: target.stix.id,
                object_modified: target.stix.modified,
              },
            },
          },
        },
      },
    });
  }

  return { relationships, operations, missing };
}

function missingEndpointError(missing) {
  const sample = missing
    .slice(0, ERROR_SAMPLE_LIMIT)
    .map((entry) => `${entry.relationship_ref} -> ${entry.missing_endpoints.join(', ')}`)
    .join('; ');
  const remaining = missing.length - ERROR_SAMPLE_LIMIT;
  const suffix = remaining > 0 ? `; and ${remaining} more` : '';
  const error = new Error(
    `Cannot pin ${missing.length} active latest relationship(s) because referenced objects are ` +
      `missing: ${sample}${suffix}`,
  );
  error.missing_relationship_endpoints = missing;
  return error;
}

async function findTrackIds(db) {
  const [registeredTracks, collections] = await Promise.all([
    db.collection('releaseTrackRegistry').find({}).project({ track_id: 1, _id: 0 }).toArray(),
    db.listCollections({}, { nameOnly: true }).toArray(),
  ]);
  return [
    ...new Set([
      ...registeredTracks.map((track) => track.track_id),
      ...collections
        .map((collection) => collection.name)
        .filter((name) => TRACK_COLLECTION_PATTERN.test(name)),
    ]),
  ].sort();
}

async function ensureManifestIndexes(db) {
  await Promise.all([
    db
      .collection('releaseTrackGraphManifests')
      .createIndex({ manifest_id: 1 }, { name: 'manifest_id_1', unique: true }),
    db
      .collection('releaseTrackGraphManifests')
      .createIndex(
        { track_id: 1, snapshot_modified: 1, state: 1 },
        { name: 'manifest_by_snapshot' },
      ),
    db
      .collection('releaseTrackGraphManifestEntries')
      .createIndex(
        { manifest_id: 1, revision_key: 1, kind: 1, tier: 1 },
        { name: 'unique_manifest_entry', unique: true },
      ),
    db
      .collection('releaseTrackGraphManifestEntries')
      .createIndex(
        { object_ref: 1, object_modified: 1, manifest_id: 1 },
        { name: 'manifest_revision_protection' },
      ),
    db
      .collection('releaseTrackGraphManifestEntries')
      .createIndex({ manifest_id: 1, kind: 1, tier: 1 }, { name: 'manifest_id_1_kind_1_tier_1' }),
  ]);
}

async function backfillSnapshotManifests(db, options) {
  const graphManifestService = require('../app/services/release-tracks/graph-manifest-service');
  const trackIds = await findTrackIds(db);
  const report = { tracks: trackIds.length, snapshots: 0, manifests_created: 0 };

  await mapWithConcurrency(trackIds, async (trackId) => {
    const collectionExists = await db
      .listCollections({ name: trackId }, { nameOnly: true })
      .hasNext();
    if (!collectionExists) return;

    const snapshots = await db.collection(trackId).find({}).toArray();
    report.snapshots += snapshots.length;
    for (const snapshot of snapshots) {
      if (snapshot.graph_manifest_id) {
        const linkedManifest = await db.collection('releaseTrackGraphManifests').findOne({
          manifest_id: snapshot.graph_manifest_id,
          state: { $in: ['pending', 'active'] },
        });
        if (linkedManifest) {
          if (!options.dryRun && linkedManifest.state === 'pending') {
            await graphManifestService.activate(linkedManifest.manifest_id);
          }
          continue;
        }
      }
      if (options.dryRun) {
        report.manifests_created++;
        continue;
      }

      const manifestId = await graphManifestService.prepare(snapshot, {
        baselineReconstruction: true,
        // Preserve the historical migration's schema-v1 frozen relationship
        // contract. New opt-in graphs use pointer-only schema v2.
        schemaVersion: 1,
      });
      try {
        await db
          .collection(trackId)
          .updateOne({ _id: snapshot._id }, { $set: { graph_manifest_id: manifestId } });
        await graphManifestService.activate(manifestId);
        report.manifests_created++;
      } catch (err) {
        await graphManifestService.discard(manifestId);
        throw err;
      }
    }
  });

  return report;
}

async function run(db, options = {}) {
  const relationshipPins = await buildRelationshipPinOperations(db);
  if (relationshipPins.missing.length > 0) {
    throw missingEndpointError(relationshipPins.missing);
  }

  if (!options.dryRun && relationshipPins.operations.length > 0) {
    await db.collection('relationships').bulkWrite(relationshipPins.operations, {
      ordered: false,
    });
  }
  if (!options.dryRun) {
    await ensureManifestIndexes(db);
  }
  const manifests = await backfillSnapshotManifests(db, options);

  return {
    relationships_scanned: relationshipPins.relationships.length,
    relationship_pins_written: relationshipPins.operations.length,
    ...manifests,
    dry_run: options.dryRun === true,
  };
}

module.exports = {
  async up(db) {
    const report = await run(db);
    console.log(
      `Pinned ${report.relationship_pins_written} active latest relationship revision(s) and ` +
        `created ${report.manifests_created} baseline snapshot manifest(s)`,
    );
  },

  async down(db) {
    const baselineManifests = await db
      .collection('releaseTrackGraphManifests')
      .find({ baseline_reconstruction: true })
      .project({ manifest_id: 1, track_id: 1, snapshot_modified: 1, _id: 0 })
      .toArray();

    await mapWithConcurrency(baselineManifests, async (manifest) => {
      if (await db.listCollections({ name: manifest.track_id }, { nameOnly: true }).hasNext()) {
        await db.collection(manifest.track_id).updateOne(
          {
            modified: manifest.snapshot_modified,
            graph_manifest_id: manifest.manifest_id,
          },
          { $unset: { graph_manifest_id: '' } },
        );
      }
    });
    const manifestIds = baselineManifests.map((manifest) => manifest.manifest_id);
    if (manifestIds.length > 0) {
      await db
        .collection('releaseTrackGraphManifestEntries')
        .deleteMany({ manifest_id: { $in: manifestIds } });
      await db
        .collection('releaseTrackGraphManifests')
        .deleteMany({ manifest_id: { $in: manifestIds } });
    }
  },

  _private: {
    run,
    latestRelationships,
    buildRelationshipPinOperations,
    findTrackIds,
  },
};
