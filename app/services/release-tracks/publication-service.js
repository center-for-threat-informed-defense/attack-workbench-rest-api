'use strict';

// =============================================================================
// Publication Service
//
// Resolves the metadata that appears on a snapshot's emitted
// x-mitre-collection object. Each attribute follows an inheritance rule: the
// track configuration may carry an explicit override, otherwise the value is
// inherited from the global system configuration. Release commit freezes the
// resolved values onto the tagged snapshot so later configuration changes
// cannot alter a published release; drafts resolve the rule at export time.
//
// This service performs cross-service READS only (organization identity and
// default marking definitions).
// =============================================================================

const config = require('../../config/config');
const systemConfigurationService = require('../system/system-configuration-service');
const { BadRequestError, ReleaseConflictError } = require('../../exceptions');

function collectionIdForTrack(trackId) {
  return `x-mitre-collection--${trackId.split('--')[1]}`;
}

function inheritedSetting(setting) {
  if (!setting || setting.inherit !== false) return { inherit: true };
  return { inherit: false, value: setting.value };
}

/**
 * Resolve every publication attribute for a snapshot from its configuration
 * and the global scope.
 *
 * @param {Object} snapshot
 * @returns {Promise<{
 *   collection_id: string,
 *   created: Date,
 *   created_by_ref: string,
 *   object_marking_refs: string[],
 *   attack_spec_version: string,
 *   sources: Object,
 * }>}
 */
async function resolvePublication(snapshot) {
  const publication = snapshot.config?.publication || {};
  const identitySetting = inheritedSetting(publication.created_by_ref);
  const markingSetting = inheritedSetting(publication.object_marking_refs);

  let createdByRef;
  if (identitySetting.inherit) {
    const organizationIdentity = await systemConfigurationService.retrieveOrganizationIdentity();
    createdByRef = organizationIdentity.stix.id;
  } else {
    createdByRef = identitySetting.value;
  }

  let objectMarkingRefs;
  if (markingSetting.inherit) {
    objectMarkingRefs = await systemConfigurationService.retrieveDefaultMarkingDefinitions({
      refOnly: true,
    });
  } else {
    objectMarkingRefs = markingSetting.value || [];
  }

  return {
    collection_id: publication.collection_id || collectionIdForTrack(snapshot.id),
    created: new Date(publication.created || snapshot.created || snapshot.modified),
    created_by_ref: createdByRef,
    object_marking_refs: [...objectMarkingRefs],
    attack_spec_version: config.app.attackSpecVersion,
    sources: {
      collection_id: publication.collection_id ? 'track' : 'derived',
      created: publication.created ? 'track' : 'derived',
      created_by_ref: identitySetting.inherit ? 'global' : 'track',
      // When neither scope configures markings the exported collection object
      // carries the marking definitions referenced by its contents.
      object_marking_refs: !markingSetting.inherit
        ? 'track'
        : objectMarkingRefs.length > 0
          ? 'global'
          : 'content',
    },
  };
}

/**
 * Publication values used to render a snapshot's collection object: the
 * frozen values for a tagged snapshot, otherwise the currently resolved rule.
 */
async function publicationForExport(snapshot) {
  if (snapshot.version != null && snapshot.publication) {
    return {
      collection_id: snapshot.publication.collection_id,
      created: new Date(snapshot.publication.created),
      created_by_ref: snapshot.publication.created_by_ref,
      object_marking_refs: [...(snapshot.publication.object_marking_refs || [])],
      attack_spec_version: snapshot.publication.attack_spec_version,
    };
  }
  const resolved = await resolvePublication(snapshot);
  delete resolved.sources;
  return resolved;
}

/**
 * Freeze the resolved publication values for a release commit.
 */
async function freezePublication(snapshot) {
  const resolved = await resolvePublication(snapshot);
  return {
    collection_id: resolved.collection_id,
    created: resolved.created,
    created_by_ref: resolved.created_by_ref,
    object_marking_refs: resolved.object_marking_refs,
    attack_spec_version: resolved.attack_spec_version,
  };
}

/**
 * Merge a publication configuration update onto the existing configuration,
 * enforcing that collection identity and creation time cannot change once the
 * track has a tagged release.
 *
 * @param {Object} existing - Current config.publication (may be undefined)
 * @param {Object} update - Validated request publication object
 * @param {boolean} hasReleases - Whether the track has any tagged snapshot
 * @returns {Object} Merged publication configuration
 */
function mergePublicationConfig(existing = {}, update = {}, hasReleases = false) {
  const merged = {
    ...existing,
    created_by_ref: inheritedSetting(existing.created_by_ref),
    object_marking_refs: inheritedSetting(existing.object_marking_refs),
  };

  for (const field of ['collection_id', 'created']) {
    if (!Object.prototype.hasOwnProperty.call(update, field)) continue;
    const next = update[field] == null ? undefined : update[field];
    const current = existing[field] == null ? undefined : existing[field];
    const changed =
      field === 'created'
        ? (next ? new Date(next).getTime() : undefined) !==
          (current ? new Date(current).getTime() : undefined)
        : next !== current;
    if (changed && hasReleases) {
      throw new ReleaseConflictError(
        `Publication ${field} cannot change after the release track has a tagged release`,
        { field },
      );
    }
    if (next === undefined) delete merged[field];
    else merged[field] = field === 'created' ? new Date(next) : next;
  }

  for (const field of ['created_by_ref', 'object_marking_refs']) {
    if (!Object.prototype.hasOwnProperty.call(update, field)) continue;
    const setting = update[field];
    if (setting.inherit) {
      merged[field] = { inherit: true };
    } else {
      if (setting.value === undefined) {
        throw new BadRequestError({
          message: `Publication ${field} requires a value when inherit is false`,
        });
      }
      merged[field] = { inherit: false, value: setting.value };
    }
  }

  return merged;
}

module.exports = {
  collectionIdForTrack,
  resolvePublication,
  publicationForExport,
  freezePublication,
  mergePublicationConfig,
};
