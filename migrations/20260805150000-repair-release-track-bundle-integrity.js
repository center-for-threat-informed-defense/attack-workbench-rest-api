'use strict';

/**
 * Repair frozen x-mitre-collection entries for persisted release-track graph
 * manifests and recompute the exact STIX 2.0/2.1 download hashes for tagged
 * snapshots. Draft snapshots may contain historical baseline manifests, but
 * their exports remain live and therefore do not receive deterministic hashes.
 */

const { isDeepStrictEqual } = require('node:util');
const mongoose = require('mongoose');
const logger = require('../app/lib/logger');

const MIGRATION_NAME = '20260805150000-repair-release-track-bundle-integrity';

function ensureMongooseUsesClient(client) {
  if (client && mongoose.connection.readyState === 0) {
    mongoose.connection.setClient(client);
  }
}

async function organizationIdentityRef(db) {
  const systemConfig = await db
    .collection('systemconfigurations')
    .findOne({}, { sort: { created_at: -1 }, projection: { organization_identity_ref: 1 } });
  if (!systemConfig?.organization_identity_ref) {
    throw new Error(
      'System configuration is missing organization_identity_ref; cannot repair graph bundles.',
    );
  }
  return systemConfig.organization_identity_ref;
}

function expectedCollectionId(trackId) {
  return `x-mitre-collection--${trackId.split('--')[1]}`;
}

async function linkedGraphSnapshots(db) {
  const manifests = await db
    .collection('releaseTrackGraphManifests')
    .find({ state: { $in: ['pending', 'active'] } })
    .sort({ track_id: 1, created_at: 1, _id: 1 })
    .toArray();
  const collectionNames = new Set(
    (await db.listCollections({}, { nameOnly: true }).toArray()).map((entry) => entry.name),
  );
  const linked = [];

  for (const manifest of manifests) {
    if (!collectionNames.has(manifest.track_id)) continue;
    const snapshot = await db.collection(manifest.track_id).findOne({
      graph_manifest_id: manifest.manifest_id,
      modified: manifest.snapshot_modified,
    });
    if (snapshot) linked.push({ manifest, snapshot });
  }
  return { manifests, linked };
}

async function run(db, client, options = {}) {
  ensureMongooseUsesClient(client);
  const graphManifestService = require('../app/services/release-tracks/graph-manifest-service');
  const bundleHashService = require('../app/services/release-tracks/bundle-hash-service');
  const createdByRef = await organizationIdentityRef(db);
  const { manifests, linked } = await linkedGraphSnapshots(db);
  const report = {
    manifests_scanned: manifests.length,
    linked_snapshots: linked.length,
    collection_entries_repaired: 0,
    bundle_hashes_recomputed: 0,
    draft_hashes_cleared: 0,
    orphaned_manifests_skipped: manifests.length - linked.length,
    dry_run: options.dryRun === true,
  };

  for (const { manifest, snapshot } of linked) {
    const collectionEntry = await db.collection('releaseTrackGraphManifestEntries').findOne({
      manifest_id: manifest.manifest_id,
      kind: 'collection',
    });
    const collectionNeedsRepair =
      !collectionEntry ||
      collectionEntry.object_ref !== expectedCollectionId(manifest.track_id) ||
      collectionEntry.revision_key !== `${expectedCollectionId(manifest.track_id)}::collection` ||
      collectionEntry.frozen_stix?.id !== expectedCollectionId(manifest.track_id) ||
      collectionEntry.frozen_stix?.created_by_ref !== createdByRef;
    if (collectionNeedsRepair) report.collection_entries_repaired++;

    if (options.dryRun) {
      if (typeof snapshot.version === 'string') report.bundle_hashes_recomputed++;
      else if (snapshot.bundle_hashes) report.draft_hashes_cleared++;
      continue;
    }

    await graphManifestService.refreshCollectionEntry(snapshot, manifest);

    if (typeof snapshot.version !== 'string') {
      if (snapshot.bundle_hashes) {
        await db
          .collection(manifest.track_id)
          .updateOne({ _id: snapshot._id }, { $unset: { bundle_hashes: '' } });
        report.draft_hashes_cleared++;
      }
      continue;
    }

    const bundleHashes = await bundleHashService.generateBundleHashes(snapshot);
    if (!isDeepStrictEqual(snapshot.bundle_hashes, bundleHashes)) {
      report.bundle_hashes_recomputed++;
      await db
        .collection(manifest.track_id)
        .updateOne({ _id: snapshot._id }, { $set: { bundle_hashes: bundleHashes } });
    }
  }

  return report;
}

module.exports = {
  async up(db, client) {
    const report = await run(db, client);
    logger.info(`[${MIGRATION_NAME}] ${JSON.stringify(report)}`);
  },

  async down() {
    logger.info(
      `[${MIGRATION_NAME}] down migration is a no-op: corrected collection identities and hashes are retained`,
    );
  },

  _private: {
    run,
    linkedGraphSnapshots,
    expectedCollectionId,
  },
};
