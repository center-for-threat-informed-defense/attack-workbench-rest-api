'use strict';

// =============================================================================
// Release Tracks Service Facade
//
// Orchestrator that delegates to domain-specific sub-services. This is the
// single entry point consumed by the controller layer.
//
// Phase 1: Track management, snapshot CRUD, config → snapshot-service
// Phase 2: Candidates, staged, object versions    → standard-track-service
// Phase 3: Auto-promotion, workflow               → workflow-service
// Phase 4: Release planning and versioning        → versioning-service
// Phase 5: Virtual track composition              → virtual-track-service
// Phase 6: Export, ephemeral, bundle import        → export-service, ephemeral-service, bundle-import-service
// =============================================================================

const { NotImplementedError } = require('../../exceptions');
const snapshotService = require('./snapshot-service');
const standardTrackService = require('./standard-track-service');
const versioningService = require('./versioning-service');
const virtualTrackService = require('./virtual-track-service');
const exportService = require('./export-service');
const ephemeralService = require('./ephemeral-service');
const bundleImportService = require('./bundle-import-service');
const memberSyncService = require('./member-sync-service');
const releaseHistoryService = require('./release-history-service');
const attackObjectsService = require('../stix/attack-objects-service');
const userAccountsService = require('../system/user-accounts-service');

const MODULE = 'release-tracks-service';
const TIER_NAMES = ['members', 'staged', 'candidates', 'quarantine'];

function notImplemented(methodName) {
  throw new NotImplementedError(MODULE, methodName);
}

function rejectFilesystemStoreFormat(format, methodName) {
  if (format !== 'filesystemstore') return;

  throw new NotImplementedError(MODULE, methodName, {
    message: 'The filesystemstore format is not yet implemented',
  });
}

function versionKey(objectRef, objectModified) {
  return `${objectRef}:${new Date(objectModified).toISOString()}`;
}

function getTierUserId(entry) {
  return entry.object_added_by || entry.object_staged_by;
}

function formatUser(user) {
  if (!user) return undefined;

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    name: user.displayName || user.username,
  };
}

async function getUsersById(userIds) {
  const usersById = new Map();

  await Promise.all(
    userIds.map(async (userId) => {
      if (userId === 'system') {
        usersById.set(userId, { id: userId, username: userId });
        return;
      }

      const user = await userAccountsService.getLatest(userId);
      if (user) {
        usersById.set(userId, user);
      }
    }),
  );

  return usersById;
}

function addObjectInfo(entry, objectsByVersion, usersById) {
  const object = objectsByVersion.get(versionKey(entry.object_ref, entry.object_modified));
  const entryWithObjectInfo = {
    ...entry,
  };

  if (object) {
    entryWithObjectInfo.attack_id = object.workspace?.attack_id;
    entryWithObjectInfo.name = object.stix?.name;
  }

  if (object?.stix?.description !== undefined) {
    entryWithObjectInfo.description = object.stix.description;
  }

  const user = object?.created_by_user_account || usersById.get(getTierUserId(entry));
  if (user) {
    entryWithObjectInfo.modified_by_user = formatUser(user);
  }

  return entryWithObjectInfo;
}

async function addObjectInfoToSnapshot(snapshot) {
  const tierEntries = TIER_NAMES.flatMap((tierName) => snapshot[tierName] || []);

  if (tierEntries.length === 0) {
    return snapshot;
  }

  const uniqueEntriesByVersion = new Map();
  for (const entry of tierEntries) {
    uniqueEntriesByVersion.set(versionKey(entry.object_ref, entry.object_modified), entry);
  }

  const objects = await attackObjectsService.getBulkByIdAndModified([
    ...uniqueEntriesByVersion.values(),
  ]);
  const objectsByVersion = new Map(
    objects.map((object) => [versionKey(object.stix.id, object.stix.modified), object]),
  );
  const userIds = [...new Set(tierEntries.map(getTierUserId).filter(Boolean))];
  const usersById = await getUsersById(userIds);

  const snapshotWithObjectInfo = { ...snapshot };
  for (const tierName of TIER_NAMES) {
    if (snapshot[tierName]) {
      snapshotWithObjectInfo[tierName] = snapshot[tierName].map((entry) =>
        addObjectInfo(entry, objectsByVersion, usersById),
      );
    }
  }

  return snapshotWithObjectInfo;
}

function filterSnapshotTiers(snapshot, include) {
  if (!include || include === 'all') return snapshot;

  const includedTiers = new Set(['members', include]);
  const filtered = { ...snapshot };

  for (const tierName of TIER_NAMES) {
    if (!includedTiers.has(tierName)) {
      delete filtered[tierName];
    }
  }

  return filtered;
}

async function formatWorkbenchSnapshot(snapshot, options) {
  const enriched = await addObjectInfoToSnapshot(snapshot);
  return filterSnapshotTiers(enriched, options?.include);
}

// -----------------------------------------------------------------------------
// Track management  (Phase 1 → snapshot-service)
// -----------------------------------------------------------------------------

exports.listTracks = function listTracks(options) {
  return snapshotService.listTracks(options);
};

exports.getReleasesByObject = function getReleasesByObject(objectRef, options) {
  return releaseHistoryService.getReleasesByObject(objectRef, options);
};

exports.createTrack = async function createTrack(data) {
  if (data.type === 'virtual' && data.composition) {
    await virtualTrackService.validateComposition(data.composition);
  }

  return snapshotService.createTrack(data);
};

// Phase 6 → bundle-import-service
exports.createTrackFromBundle = function createTrackFromBundle(bundleData) {
  return bundleImportService.createTrackFromBundle(bundleData);
};

exports.listSnapshots = function listSnapshots(trackId, options) {
  return snapshotService.listSnapshots(trackId, options);
};

// eslint-disable-next-line no-unused-vars
exports.importTrack = async function importTrack(_data) {
  notImplemented('importTrack');
};

// Phase 6: Format-aware snapshot retrieval
// - 'workbench' format (or no format): returns enriched release-track snapshot
// - 'bundle' format: hydrates members and transforms via export-service
// - 'filesystemstore': blocked before delegation (NotImplementedError)
exports.getLatestSnapshot = async function getLatestSnapshot(trackId, options) {
  const snapshot = await snapshotService.getLatestSnapshot(trackId, options);
  const format = options?.format;
  rejectFilesystemStoreFormat(format, 'getLatestSnapshot');

  if (format === 'bundle') {
    return exportService.exportSnapshot(snapshot, format, options);
  }
  return formatWorkbenchSnapshot(snapshot, options);
};

exports.getSnapshotByModified = async function getSnapshotByModified(trackId, modified, options) {
  const snapshot = await snapshotService.getSnapshotByModified(trackId, modified, options);
  const format = options?.format;
  rejectFilesystemStoreFormat(format, 'getSnapshotByModified');

  if (format === 'bundle') {
    return exportService.exportSnapshot(snapshot, format, options);
  }
  return formatWorkbenchSnapshot(snapshot, options);
};

exports.updateMetadata = function updateMetadata(trackId, updates, userId) {
  return snapshotService.updateMetadata(trackId, updates, userId);
};

exports.updateMetadataByModified = function updateMetadataByModified(
  trackId,
  modified,
  updates,
  userId,
) {
  return snapshotService.updateMetadataByModified(trackId, modified, updates, userId);
};

exports.updateContents = function updateContents(trackId, contents, userId) {
  return snapshotService.updateContents(trackId, contents, userId);
};

exports.updateContentsByModified = function updateContentsByModified(
  trackId,
  modified,
  contents,
  userId,
) {
  return snapshotService.updateContentsByModified(trackId, modified, contents, userId);
};

exports.cloneTrack = function cloneTrack(trackId, options) {
  return snapshotService.cloneTrack(trackId, options);
};

exports.cloneFromSnapshot = function cloneFromSnapshot(trackId, modified, options) {
  return snapshotService.cloneFromSnapshot(trackId, modified, options);
};

exports.deleteTrack = function deleteTrack(trackId) {
  return snapshotService.deleteTrack(trackId);
};

exports.deleteSnapshot = function deleteSnapshot(trackId, modified) {
  return snapshotService.deleteSnapshot(trackId, modified);
};

// -----------------------------------------------------------------------------
// Ephemeral  (Phase 6 → ephemeral-service)
// -----------------------------------------------------------------------------

exports.getEphemeralBundle = function getEphemeralBundle(domain, options) {
  rejectFilesystemStoreFormat(options?.format, 'getEphemeralBundle');
  return ephemeralService.getEphemeralBundle(domain, options);
};

// -----------------------------------------------------------------------------
// Candidates  (Phase 2 → standard-track-service)
// -----------------------------------------------------------------------------

exports.addCandidates = function addCandidates(trackId, objectRefs, userId) {
  return standardTrackService.addCandidates(trackId, objectRefs, userId);
};

exports.listCandidates = function listCandidates(trackId, options) {
  return standardTrackService.listCandidates(trackId, options);
};

exports.removeCandidate = function removeCandidate(trackId, objectRef) {
  return standardTrackService.removeCandidate(trackId, objectRef);
};

exports.reviewCandidates = function reviewCandidates(trackId, reviewData, userId) {
  return standardTrackService.reviewCandidates(trackId, reviewData, userId);
};

exports.promoteCandidates = function promoteCandidates(trackId, objectRefs, userId) {
  return standardTrackService.promoteCandidates(trackId, objectRefs, userId);
};

exports.updateCandidateVersion = function updateCandidateVersion(trackId, objectRef, data) {
  return standardTrackService.updateCandidateVersion(trackId, objectRef, data);
};

// -----------------------------------------------------------------------------
// Staged  (Phase 2 → standard-track-service)
// -----------------------------------------------------------------------------

exports.listStaged = function listStaged(trackId) {
  return standardTrackService.listStaged(trackId);
};

exports.demoteStaged = function demoteStaged(trackId, objectRefs, userId) {
  return standardTrackService.demoteStaged(trackId, objectRefs, userId);
};

// -----------------------------------------------------------------------------
// Versioning  (Phase 4 → versioning-service)
// -----------------------------------------------------------------------------

exports.releaseLatest = function releaseLatest(trackId, options) {
  return versioningService.releaseLatest(trackId, options);
};

exports.releaseByModified = function releaseByModified(trackId, modified, options) {
  return versioningService.releaseByModified(trackId, modified, options);
};

async function renderReleasePlan(plan, options) {
  const format = options.format || 'summary';
  rejectFilesystemStoreFormat(format, 'previewRelease');

  if (format === 'summary') return plan.summary;
  if (plan.blockingError) throw plan.blockingError;
  if (format === 'bundle') {
    return exportService.exportSnapshot(plan.plannedSnapshot, format, options);
  }
  return formatWorkbenchSnapshot(plan.plannedSnapshot, options);
}

exports.previewLatestRelease = async function previewLatestRelease(trackId, options) {
  const plan = await versioningService.planLatestRelease(trackId, options);
  return renderReleasePlan(plan, options);
};

exports.previewReleaseByModified = async function previewReleaseByModified(
  trackId,
  modified,
  options,
) {
  const plan = await versioningService.planReleaseByModified(trackId, modified, options);
  return renderReleasePlan(plan, options);
};

// -----------------------------------------------------------------------------
// Configuration  (Phase 1 → snapshot-service)
// -----------------------------------------------------------------------------

exports.getConfig = function getConfig(trackId) {
  return snapshotService.getConfig(trackId);
};

exports.updateConfig = function updateConfig(trackId, config, userId) {
  return snapshotService.updateConfig(trackId, config, userId);
};

// -----------------------------------------------------------------------------
// Virtual tracks  (Phase 5 → virtual-track-service)
// -----------------------------------------------------------------------------

exports.updateComposition = function updateComposition(trackId, composition, userId) {
  return virtualTrackService.updateComposition(trackId, composition, userId);
};

exports.createVirtualSnapshot = function createVirtualSnapshot(trackId, options) {
  return virtualTrackService.createVirtualSnapshot(trackId, options);
};

exports.promoteQuarantinedObject = function promoteQuarantinedObject(trackId, selection) {
  return virtualTrackService.promoteQuarantinedObject(trackId, selection);
};

// -----------------------------------------------------------------------------
// Object versions  (Phase 2 → standard-track-service)
// -----------------------------------------------------------------------------

exports.listObjectVersions = function listObjectVersions(trackId, objectRef) {
  return standardTrackService.listObjectVersions(trackId, objectRef);
};

// -----------------------------------------------------------------------------
// Member sync  (Phase 7 → member-sync-service)
//
// Member sync auto-initializes when this module is loaded via the
// memberSyncService import. It subscribes to all STIX object created/updated
// events on the EventBus and automatically enrolls new object revisions
// as candidates when the object is a member of a release track.
// -----------------------------------------------------------------------------

/**
 * Manually trigger member sync for a STIX object modification.
 * Typically not needed since member-sync-service subscribes to EventBus events
 * automatically. Useful for testing or manual re-processing.
 */
exports.handleObjectModified = function handleObjectModified(event) {
  return memberSyncService.handleObjectModified(event);
};
