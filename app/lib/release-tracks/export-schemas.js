'use strict';

// =============================================================================
// Zod transform schemas for export format transformations.
//
// These schemas encapsulate the DTO transformation logic for each export format.
// Each schema takes a common input shape (snapshot + hydratedObjects) and
// transforms it to the appropriate output format.
//
// Usage:
//   const { bundleTransformSchema } = require('./export-schemas');
//   const output = bundleTransformSchema.parse({ snapshot, hydratedObjects });
//
// See docs/COLLECTIONS_V2/07_OUTPUT_FORMATS.md for format specifications.
// =============================================================================

const { z } = require('zod');
const uuid = require('uuid');
const { conformToStixVersion } = require('../stix-conformance');

// -----------------------------------------------------------------------------
// Shared sub-schemas
//
// These schemas use z.looseObject() to allow additional properties from Mongoose
// documents (e.g., _id, __v) to pass through without validation errors.
// -----------------------------------------------------------------------------

const tierEntrySchema = z.looseObject({
  object_ref: z.string(),
  object_modified: z.date().or(z.string()),
});

const snapshotSchema = z.looseObject({
  id: z.string(),
  version: z.string().nullable().optional(),
  name: z.string(),
  description: z.string().optional(),
  snapshot_description: z.string().optional(),
  created: z.date().or(z.string()).optional(),
  created_by_ref: z.string().optional(),
  modified: z.date().or(z.string()),
  members: z.array(tierEntrySchema).default([]),
  staged: z.array(tierEntrySchema).optional(),
  candidates: z.array(tierEntrySchema).optional(),
});

const hydratedObjectSchema = z.looseObject({
  stix: z.looseObject({}),
  workspace: z.looseObject({}).optional(),
});

const publicationSchema = z.looseObject({
  collection_id: z.string(),
  created: z.date().or(z.string()),
  created_by_ref: z.string(),
  object_marking_refs: z.array(z.string()),
  attack_spec_version: z.string(),
});

const exportOptionsSchema = z
  .looseObject({
    include: z.array(z.enum(['staged', 'candidates'])).optional(),
    state: z.array(z.enum(['work-in-progress', 'awaiting-review'])).optional(),
    stixVersion: z.enum(['2.0', '2.1']).default('2.1'),
    publication: publicationSchema.optional(),
    bundleId: z.string().optional(),
  })
  .optional()
  .default({});

// -----------------------------------------------------------------------------
// Base input schema (shared by all transforms)
// -----------------------------------------------------------------------------

const exportInputSchema = z.object({
  snapshot: snapshotSchema,
  hydratedObjects: z.array(hydratedObjectSchema),
  options: exportOptionsSchema,
});

// -----------------------------------------------------------------------------
// Helper: Build tier lookup for workbench format
// -----------------------------------------------------------------------------

function buildTierLookup(snapshot) {
  const lookup = {};
  for (const m of snapshot.members || []) {
    lookup[`${m.object_ref}::${new Date(m.object_modified).getTime()}`] = 'released';
  }
  for (const s of snapshot.staged || []) {
    lookup[`${s.object_ref}::${new Date(s.object_modified).getTime()}`] = 'staged';
  }
  for (const c of snapshot.candidates || []) {
    lookup[`${c.object_ref}::${new Date(c.object_modified).getTime()}`] = 'candidate';
  }
  return lookup;
}

// -----------------------------------------------------------------------------
// Helper: Build the x-mitre-collection object
//
// The collection object is the bundle's bill of materials. It is a projection
// of the snapshot and its publication metadata, never a stored object:
//   - id, created, created_by_ref, object_marking_refs, and
//     x_mitre_attack_spec_version come from the resolved (draft) or frozen
//     (tagged) publication values
//   - modified is the snapshot's modified timestamp
//   - x_mitre_version is the tagged version; drafts omit the key because a
//     draft has no publication version and a placeholder would collide with a
//     legitimate first release
//   - x_mitre_contents lists every bundle object except marking definitions
//   - object_marking_refs falls back to the marking definitions referenced by
//     the bundle's contents when neither the track nor the global scope
//     configures any, so the object never ships without markings
// -----------------------------------------------------------------------------

function buildCollectionObject(snapshot, bundleObjects, options) {
  const publication = options.publication || {};
  const created = publication.created || snapshot.created || snapshot.modified;
  const configuredMarkingRefs = publication.object_marking_refs || [];
  const contentMarkingRefs = [
    ...new Set(
      bundleObjects
        .filter((bundleObject) => bundleObject.type === 'marking-definition')
        .map((bundleObject) => bundleObject.id),
    ),
  ].sort();

  const collectionObject = {
    type: 'x-mitre-collection',
    id: publication.collection_id || `x-mitre-collection--${snapshot.id.split('--')[1]}`,
    x_mitre_attack_spec_version: publication.attack_spec_version,
    name: snapshot.name,
    ...(snapshot.version ? { x_mitre_version: snapshot.version } : {}),
    description: snapshot.snapshot_description ?? snapshot.description,
    created_by_ref: publication.created_by_ref || '',
    created: new Date(created).toISOString(),
    modified: new Date(snapshot.modified).toISOString(),
    x_mitre_contents: [],
    object_marking_refs:
      configuredMarkingRefs.length > 0 ? [...configuredMarkingRefs] : contentMarkingRefs,
  };

  for (const bundleObject of bundleObjects) {
    if (bundleObject.type === 'marking-definition') continue;
    collectionObject.x_mitre_contents.push({
      object_ref: bundleObject.id,
      object_modified: bundleObject.modified,
    });
  }

  if (options.stixVersion === '2.1') {
    collectionObject.spec_version = '2.1';
  }

  // Sort x_mitre_contents by id for deterministic output
  collectionObject.x_mitre_contents.sort((x, y) => x.object_ref.localeCompare(y.object_ref));

  return collectionObject;
}

// -----------------------------------------------------------------------------
// Bundle Transform Schema
//
// Standard STIX bundle format. Only includes `stix` properties - no workspace
// data or workflow metadata. Suitable for external publication.
//
// Options:
//   - stixVersion ('2.0' | '2.1', default '2.1'): each object is conformed to
//     the requested STIX version. The bundle envelope carries spec_version
//     only for STIX 2.0 — the STIX 2.1 specification removed spec_version
//     from the bundle object (objects declare their own spec_version).
//   - publication: resolved or frozen collection metadata. STIX 2.1 bundles
//     always begin with the x-mitre-collection object; STIX 2.0 bundles never
//     contain this ATT&CK extension object.
//   - bundleId: stable envelope identifier
//
// Notes are Workbench-native objects, not STIX objects, so they are never
// included in emitted bundles.
// -----------------------------------------------------------------------------

const bundleTransformSchema = exportInputSchema.transform((input) => {
  const { stixVersion, publication, bundleId } = input.options;

  const objects = input.hydratedObjects
    .map((doc) => doc.stix)
    .filter((stixObject) => stixObject.type !== 'note');

  for (const stixObject of objects) {
    conformToStixVersion(stixObject, stixVersion);
  }

  if (stixVersion === '2.1') {
    const collectionObject = buildCollectionObject(input.snapshot, objects, {
      stixVersion,
      publication,
    });
    conformToStixVersion(collectionObject, stixVersion);
    objects.unshift(collectionObject);
  }

  return {
    type: 'bundle',
    id: bundleId || `bundle--${uuid.v4()}`,
    // STIX 2.0 bundles must declare spec_version; STIX 2.1 bundles must not
    ...(stixVersion === '2.0' ? { spec_version: '2.0' } : {}),
    objects,
  };
});

// -----------------------------------------------------------------------------
// Workbench Transform Schema
//
// Workbench-optimized format with full metadata. Includes `stix` + `workspace`
// properties and tier annotations. Optimized for Workbench UI consumption.
// -----------------------------------------------------------------------------

const workbenchTransformSchema = exportInputSchema.transform((input) => {
  const tierLookup = buildTierLookup(input.snapshot);

  const objects = input.hydratedObjects.map((doc) => {
    const key = `${doc.stix.id}::${new Date(doc.stix.modified).getTime()}`;
    return {
      stix: doc.stix,
      workspace: doc.workspace || {},
      metadata: {
        collection_tier: tierLookup[key] || 'released',
        object_type: doc.stix.type,
        object_name: doc.stix.name || doc.stix.id,
      },
    };
  });

  return {
    collection: {
      id: input.snapshot.id,
      version: input.snapshot.version,
      name: input.snapshot.name,
      modified: input.snapshot.modified,
    },
    objects,
    summary: {
      released_count: (input.snapshot.members || []).length,
      staged_count: (input.snapshot.staged || []).length,
      candidates_count: (input.snapshot.candidates || []).length,
    },
  };
});

// -----------------------------------------------------------------------------
// FilesystemStore Transform Schema
//
// STIX FileSystemStore-compatible directory structure. Objects are grouped by
// STIX type, each with a filename and content property.
// -----------------------------------------------------------------------------

const filesystemStoreTransformSchema = exportInputSchema.transform((input) => {
  const structure = {};

  for (const doc of input.hydratedObjects) {
    const type = doc.stix.type;
    if (!structure[type]) structure[type] = [];
    structure[type].push({
      filename: `${doc.stix.id}.json`,
      content: doc.stix,
    });
  }

  return {
    format: 'filesystemstore',
    track_id: input.snapshot.id,
    version: input.snapshot.version,
    structure,
  };
});

// =============================================================================
// Exports
// =============================================================================

module.exports = {
  // Input schemas (for validation/testing)
  exportInputSchema,
  snapshotSchema,
  hydratedObjectSchema,
  exportOptionsSchema,

  // Transform schemas
  bundleTransformSchema,
  workbenchTransformSchema,
  filesystemStoreTransformSchema,

  // Helpers (exported for testing)
  buildTierLookup,
  buildCollectionObject,
};
