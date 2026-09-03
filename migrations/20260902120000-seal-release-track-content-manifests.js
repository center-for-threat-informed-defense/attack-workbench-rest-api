'use strict';

/**
 * Seal a content manifest for every release-track snapshot and freeze
 * publication metadata onto tagged snapshots.
 *
 * Before this migration a manifest ("graph cache") was an optional, deletable
 * attachment on tagged snapshots. Afterwards every snapshot references a
 * sealed manifest from birth (see
 * docs/developer/release-tracks/sealed-content-manifests.md). Per snapshot:
 *
 *   - `graph_manifest_id` is renamed to `content_manifest_id`.
 *   - A tagged snapshot without a manifest is sealed from the current
 *     database and labeled `baseline_reconstruction` because it describes the
 *     graph visible at migration time, not an unknowable historical graph.
 *   - A draft without a manifest shares the manifest of the nearest preceding
 *     tagged snapshot with an identical member set, otherwise it is sealed.
 *   - The former top-level `object_marking_refs` moves into
 *     `config.publication.object_marking_refs` as an explicit override.
 *   - Tagged snapshots receive frozen `publication` values, a `bundle_id`
 *     (preserving the manifest-derived envelope ID they exported before), and
 *     recomputed `bundle_hashes`.
 *   - Frozen `collection` manifest entries are removed; the collection object
 *     is now a projection rendered at export.
 *   - Manifest storage moves from `releaseTrackGraphManifest*` to
 *     `releaseTrackContentManifest*`, manifest ids adopt the
 *     `release-track-content-manifest--` prefix, `resolver_version` and
 *     `baseline_reconstruction` are dropped, and `seal_reason` is backfilled.
 *   - The retired `config.include_secondary_objects` block is removed and
 *     completed `releaseTrackReconciliations` records are deleted.
 *
 * Only tracks present in `releaseTrackRegistry` are migrated. A dynamic
 * `release-track--*` collection without a registry document is an orphan
 * left behind by an interrupted or pre-registry deletion: the API cannot
 * list it, its snapshots routinely reference revisions that no longer exist,
 * and sealing it would protect stale revisions from deletion. Orphans are
 * reported, any manifests they own are discarded, and the collections are
 * left in place for an operator to drop.
 *
 * The migration is idempotent and supports a read-only dry run through
 * `_private.run(db, { dryRun: true })`.
 */

const TRACK_COLLECTION_PATTERN =
  /^release-track--[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LEGACY_MANIFEST_ID_PREFIX = 'release-track-graph-manifest--';
const MANIFEST_ID_PREFIX = 'release-track-content-manifest--';
const MANIFESTS = 'releaseTrackContentManifests';
const ENTRIES = 'releaseTrackContentManifestEntries';
const LEGACY_COLLECTIONS = {
  releaseTrackGraphManifests: MANIFESTS,
  releaseTrackGraphManifestEntries: ENTRIES,
};

function contentManifestId(manifestId) {
  return manifestId?.startsWith(LEGACY_MANIFEST_ID_PREFIX)
    ? `${MANIFEST_ID_PREFIX}${manifestId.slice(LEGACY_MANIFEST_ID_PREFIX.length)}`
    : manifestId;
}

async function collectionExists(db, name) {
  return db.listCollections({ name }, { nameOnly: true }).hasNext();
}

/**
 * Move manifests and entries from the former `releaseTrackGraphManifest*`
 * collections into their `releaseTrackContentManifest*` successors and
 * normalize the manifest header:
 *   - ids adopt the `release-track-content-manifest--` prefix (bundle ids
 *     were already frozen onto tagged snapshots, so hashes are unaffected)
 *   - `resolver_version` and `baseline_reconstruction` are dropped
 *   - `seal_reason` is backfilled: attested manifests are
 *     `source_reconstruction`, any other manifest that predates this
 *     migration is `legacy_graph`
 */
async function normalizeManifestStorage(db, options, report) {
  for (const [legacy, target] of Object.entries(LEGACY_COLLECTIONS)) {
    if (!(await collectionExists(db, legacy))) continue;
    const legacyCount = await db.collection(legacy).countDocuments({});
    report.legacy_manifest_documents_moved += legacyCount;
    if (options.dryRun) continue;
    if (!(await collectionExists(db, target))) {
      if (legacyCount > 0) {
        await db.collection(legacy).rename(target);
      } else {
        await db.collection(legacy).drop();
      }
      continue;
    }
    if (legacyCount > 0) {
      const documents = await db.collection(legacy).find({}).toArray();
      try {
        await db.collection(target).insertMany(documents, { ordered: false });
      } catch (err) {
        if (err.code !== 11000 && !err.writeErrors) throw err;
      }
    }
    await db.collection(legacy).drop();
  }

  const headerFilter = {
    $or: [
      { manifest_id: { $regex: `^${LEGACY_MANIFEST_ID_PREFIX}` } },
      { seal_reason: { $exists: false } },
      { resolver_version: { $exists: true } },
      { baseline_reconstruction: { $exists: true } },
    ],
  };
  if (options.dryRun) {
    // Legacy documents are still in the old collections during a dry run.
    report.manifest_headers_normalized += await countAcross(db, 'manifests', headerFilter);
    return;
  }
  if (!(await collectionExists(db, MANIFESTS))) return;
  const manifests = await db
    .collection(MANIFESTS)
    .find(headerFilter)
    .project({ manifest_id: 1, seal_reason: 1, source_attestation: 1 })
    .toArray();
  report.manifest_headers_normalized += manifests.length;

  for (const manifest of manifests) {
    const newId = contentManifestId(manifest.manifest_id);
    const sealReason =
      manifest.seal_reason ||
      (manifest.source_attestation ? 'source_reconstruction' : 'legacy_graph');
    await db.collection(MANIFESTS).updateOne(
      { _id: manifest._id },
      {
        $set: { manifest_id: newId, seal_reason: sealReason },
        $unset: { resolver_version: '', baseline_reconstruction: '' },
      },
    );
    if (newId !== manifest.manifest_id) {
      await db
        .collection(ENTRIES)
        .updateMany({ manifest_id: manifest.manifest_id }, { $set: { manifest_id: newId } });
    }
  }
}

async function normalizeSnapshotReferences(db, collection, snapshot, options, setOps, unsetOps) {
  if (snapshot.content_manifest_id?.startsWith(LEGACY_MANIFEST_ID_PREFIX)) {
    setOps.content_manifest_id = contentManifestId(snapshot.content_manifest_id);
  }
  if (snapshot.bundle_hashes?.manifest_id?.startsWith(LEGACY_MANIFEST_ID_PREFIX)) {
    setOps['bundle_hashes.manifest_id'] = contentManifestId(snapshot.bundle_hashes.manifest_id);
  }
  if (snapshot.config?.include_secondary_objects !== undefined) {
    unsetOps['config.include_secondary_objects'] = '';
  }
}

function memberSetKey(snapshot) {
  return (snapshot.members || [])
    .map((entry) => `${entry.object_ref}::${new Date(entry.object_modified).getTime()}`)
    .sort()
    .join('|');
}

async function findTrackIds(db) {
  const registeredTracks = await db
    .collection('releaseTrackRegistry')
    .find({})
    .project({ track_id: 1, _id: 0 })
    .toArray();
  return [...new Set(registeredTracks.map((track) => track.track_id))].sort();
}

/**
 * Dynamic release-track collections that no registry document references.
 */
async function findOrphanTrackCollections(db, registeredTrackIds) {
  const registered = new Set(registeredTrackIds);
  const collections = await db.listCollections({}, { nameOnly: true }).toArray();
  return collections
    .map((collection) => collection.name)
    .filter((name) => TRACK_COLLECTION_PATTERN.test(name) && !registered.has(name))
    .sort();
}

/**
 * Manifest collections to consult. Before the rename step runs (and during a
 * dry run, which never renames) legacy documents still live in the old
 * collections, so lookups and counts cover both.
 */
async function manifestCollections(db, kind) {
  const names =
    kind === 'entries'
      ? [ENTRIES, 'releaseTrackGraphManifestEntries']
      : [MANIFESTS, 'releaseTrackGraphManifests'];
  const present = [];
  for (const name of names) {
    if (await collectionExists(db, name)) present.push(name);
  }
  return present;
}

async function countAcross(db, kind, filter) {
  let total = 0;
  for (const name of await manifestCollections(db, kind)) {
    total += await db.collection(name).countDocuments(filter);
  }
  return total;
}

async function activeManifest(db, manifestId) {
  if (!manifestId) return null;
  const ids = [...new Set([manifestId, contentManifestId(manifestId)])];
  for (const name of await manifestCollections(db, 'manifests')) {
    const manifest = await db.collection(name).findOne({
      manifest_id: { $in: ids },
      state: { $in: ['pending', 'active'] },
    });
    if (manifest) return manifest;
  }
  return null;
}

function emptyReport(dryRun) {
  return {
    tracks: 0,
    snapshots: 0,
    renamed_manifest_fields: 0,
    marking_refs_migrated: 0,
    manifests_sealed: 0,
    manifests_shared: 0,
    publications_frozen: 0,
    bundle_hashes_recomputed: 0,
    collection_entries_removed: 0,
    legacy_manifest_documents_moved: 0,
    manifest_headers_normalized: 0,
    completed_reconciliations_removed: 0,
    orphan_track_collections: [],
    orphan_manifests_discarded: 0,
    warnings: [],
    dry_run: dryRun === true,
  };
}

async function reportOrphanTrackCollections(db, trackIds, options, report) {
  const contentManifestService = require('../app/services/release-tracks/content-manifest-service');
  for (const name of await findOrphanTrackCollections(db, trackIds)) {
    const snapshots = await db.collection(name).countDocuments({});
    const manifests = await countAcross(db, 'manifests', { track_id: name });
    report.orphan_track_collections.push({
      collection: name,
      snapshots,
      manifests,
      message:
        'Not present in releaseTrackRegistry; skipped. Drop the collection once you have ' +
        'confirmed it is a remnant of a deleted track.',
    });
    report.orphan_manifests_discarded += manifests;
    if (!options.dryRun && manifests > 0) {
      await contentManifestService.discardTrack(name);
    }
  }
}

async function migrateTrack(db, trackId, options, report) {
  const collection = db.collection(trackId);
  const snapshots = await collection.find({}).sort({ modified: 1 }).toArray();
  report.snapshots += snapshots.length;
  const sealedTaggedByMembers = new Map();

  for (const snapshot of snapshots) {
    const context = {
      track_id: trackId,
      snapshot_modified: new Date(snapshot.modified).toISOString(),
    };
    try {
      await migrateSnapshot(db, collection, snapshot, options, report, sealedTaggedByMembers);
    } catch (err) {
      throw contextualize(err, { ...context, step: err.step });
    }
  }

  const collectionEntries = await countAcross(db, 'entries', {
    track_id: trackId,
    kind: 'collection',
  });
  report.collection_entries_removed += collectionEntries;
  if (!options.dryRun && collectionEntries > 0) {
    await db.collection(ENTRIES).deleteMany({ track_id: trackId, kind: 'collection' });
  }
}

/**
 * releaseTrackReconciliations now holds outstanding work only; completed
 * records written by earlier releases are removed.
 */
async function removeCompletedReconciliations(db, options, report) {
  if (!(await collectionExists(db, 'releaseTrackReconciliations'))) return;
  const filter = { status: 'completed' };
  report.completed_reconciliations_removed += await db
    .collection('releaseTrackReconciliations')
    .countDocuments(filter);
  if (!options.dryRun) {
    await db.collection('releaseTrackReconciliations').deleteMany(filter);
  }
}

function step(name, promise) {
  return promise.catch((err) => {
    err.step = err.step || name;
    throw err;
  });
}

async function migrateSnapshot(db, collection, snapshot, options, report, sealedTaggedByMembers) {
  const contentManifestService = require('../app/services/release-tracks/content-manifest-service');
  const publicationService = require('../app/services/release-tracks/publication-service');
  const bundleHashService = require('../app/services/release-tracks/bundle-hash-service');
  const trackId = snapshot.id;
  {
    const setOps = {};
    const unsetOps = {};
    // Look the manifest up by the id the snapshot actually carries (possibly
    // the legacy prefix during a dry run), then continue with the normalized id.
    const storedManifestId = snapshot.content_manifest_id || snapshot.graph_manifest_id;
    let manifestId = (await activeManifest(db, storedManifestId))
      ? contentManifestId(storedManifestId)
      : null;

    if (!snapshot.content_manifest_id && snapshot.graph_manifest_id) {
      report.renamed_manifest_fields++;
      unsetOps.graph_manifest_id = '';
    }
    normalizeSnapshotReferences(db, collection, snapshot, options, setOps, unsetOps);

    if (Array.isArray(snapshot.object_marking_refs)) {
      unsetOps.object_marking_refs = '';
      if (snapshot.object_marking_refs.length > 0) {
        report.marking_refs_migrated++;
        setOps['config.publication.object_marking_refs'] = {
          inherit: false,
          value: snapshot.object_marking_refs,
        };
      }
    }
    const working = { ...snapshot };
    if (setOps['config.publication.object_marking_refs']) {
      working.config = {
        ...(snapshot.config || {}),
        publication: {
          ...(snapshot.config?.publication || {}),
          object_marking_refs: setOps['config.publication.object_marking_refs'],
        },
      };
    }

    const tagged = snapshot.version != null;
    if (!manifestId) {
      const shared = tagged ? null : sealedTaggedByMembers.get(memberSetKey(snapshot));
      if (shared) {
        manifestId = shared;
        report.manifests_shared++;
      } else {
        report.manifests_sealed++;
        manifestId = options.dryRun
          ? `dry-run:${snapshot._id}`
          : await step(
              'seal',
              contentManifestService.seal(working, {
                reason: 'migration',
                baselineReconstruction: true,
              }),
            );
      }
    }
    if (manifestId && manifestId !== snapshot.content_manifest_id) {
      setOps.content_manifest_id = manifestId;
    }
    if (tagged && manifestId) sealedTaggedByMembers.set(memberSetKey(snapshot), manifestId);

    if (tagged) {
      if (!snapshot.publication) {
        report.publications_frozen++;
        if (!options.dryRun) {
          setOps.publication = await step(
            'freeze_publication',
            publicationService.freezePublication(working),
          );
        }
      }
      if (!snapshot.bundle_id && manifestId) {
        // Preserve the envelope id these releases exported before the
        // migration: the manifest uuid, whichever prefix it carried.
        setOps.bundle_id = `bundle--${manifestId.split('--')[1]}`;
      }
    }

    if (options.dryRun) return;

    const update = {};
    if (Object.keys(setOps).length > 0) update.$set = setOps;
    if (Object.keys(unsetOps).length > 0) update.$unset = unsetOps;
    if (Object.keys(update).length > 0) {
      await collection.updateOne({ _id: snapshot._id }, update);
    }
    if (setOps.content_manifest_id) {
      await contentManifestService.activate(setOps.content_manifest_id);
    }

    if (tagged) {
      const current = await collection.findOne({ _id: snapshot._id });
      const expectedManifest = current.bundle_hashes?.manifest_id;
      if (!current.bundle_hashes || expectedManifest !== current.content_manifest_id) {
        try {
          const bundleHashes = await step(
            'bundle_hashes',
            bundleHashService.generateBundleHashes(current),
          );
          await collection.updateOne(
            { _id: snapshot._id },
            { $set: { bundle_hashes: bundleHashes } },
          );
          report.bundle_hashes_recomputed++;
        } catch (err) {
          report.warnings.push({
            track_id: trackId,
            snapshot_modified: new Date(snapshot.modified).toISOString(),
            message: `Bundle hashes not recomputed: ${err.message}`,
          });
        }
      } else if (setOps.publication) {
        // Publication values changed the rendered collection object.
        const bundleHashes = await step(
          'bundle_hashes',
          bundleHashService.generateBundleHashes(current),
        );
        await collection.updateOne(
          { _id: snapshot._id },
          { $set: { bundle_hashes: bundleHashes } },
        );
        report.bundle_hashes_recomputed++;
      }
    }
  }
}

async function run(db, options = {}) {
  const report = emptyReport(options.dryRun);
  const trackIds = await findTrackIds(db);
  report.tracks = trackIds.length;
  await normalizeManifestStorage(db, options, report);
  await reportOrphanTrackCollections(db, trackIds, options, report);
  await removeCompletedReconciliations(db, options, report);

  for (const trackId of trackIds) {
    const exists = await db.listCollections({ name: trackId }, { nameOnly: true }).hasNext();
    if (!exists) continue;
    await migrateTrack(db, trackId, options, report);
  }
  return report;
}

/**
 * Attach the failing snapshot and the integrity details to an error so the
 * startup log names what must be repaired.
 */
function contextualize(err, context) {
  const details = [
    `track ${context.track_id}`,
    context.snapshot_modified ? `snapshot ${context.snapshot_modified}` : null,
    context.step,
    err.details,
    err.missing_references?.length
      ? `missing_references=${JSON.stringify(err.missing_references.slice(0, 10))}`
      : null,
  ]
    .filter(Boolean)
    .join('; ');
  const wrapped = new Error(`${err.message} (${details})`);
  wrapped.cause = err;
  wrapped.context = { ...context, missing_references: err.missing_references };
  return wrapped;
}

module.exports = {
  async up(db) {
    const report = await run(db);
    console.log(
      `Normalized ${report.manifest_headers_normalized} manifest header(s), ` +
        `sealed ${report.manifests_sealed} content manifest(s), shared ${report.manifests_shared}, ` +
        `froze ${report.publications_frozen} publication record(s), recomputed ` +
        `${report.bundle_hashes_recomputed} bundle hash set(s)` +
        (report.warnings.length ? `; ${report.warnings.length} warning(s)` : '') +
        (report.orphan_track_collections.length
          ? `; skipped ${report.orphan_track_collections.length} unregistered track collection(s)`
          : ''),
    );
    for (const warning of report.warnings) {
      console.warn(JSON.stringify(warning));
    }
    for (const orphan of report.orphan_track_collections) {
      console.warn(JSON.stringify(orphan));
    }
  },

  async down(db) {
    const trackIds = await findTrackIds(db);
    for (const trackId of trackIds) {
      const exists = await db.listCollections({ name: trackId }, { nameOnly: true }).hasNext();
      if (!exists) continue;
      const collection = db.collection(trackId);
      const snapshots = await collection.find({}).toArray();
      for (const snapshot of snapshots) {
        const update = { $unset: { content_manifest_id: '', publication: '', bundle_id: '' } };
        const setOps = {};
        const manifest = await activeManifest(db, snapshot.content_manifest_id);
        if (manifest && manifest.seal_reason !== 'migration' && snapshot.version != null) {
          setOps.graph_manifest_id = snapshot.content_manifest_id;
        }
        const markings = snapshot.config?.publication?.object_marking_refs;
        if (markings && markings.inherit === false) {
          setOps.object_marking_refs = markings.value || [];
        }
        if (Object.keys(setOps).length > 0) update.$set = setOps;
        await collection.updateOne({ _id: snapshot._id }, update);
      }
    }
    const migrated = await db
      .collection(MANIFESTS)
      .find({ seal_reason: 'migration' })
      .project({ manifest_id: 1, _id: 0 })
      .toArray();
    const manifestIds = migrated.map((manifest) => manifest.manifest_id);
    if (manifestIds.length > 0) {
      await db.collection(ENTRIES).deleteMany({ manifest_id: { $in: manifestIds } });
      await db.collection(MANIFESTS).deleteMany({ manifest_id: { $in: manifestIds } });
    }
  },

  _private: {
    run,
    findTrackIds,
    findOrphanTrackCollections,
    memberSetKey,
  },
};
