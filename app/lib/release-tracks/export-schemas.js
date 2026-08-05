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
  object_marking_refs: z.array(z.string()).optional(),
  modified: z.date().or(z.string()),
  members: z.array(tierEntrySchema).default([]),
  staged: z.array(tierEntrySchema).optional(),
  candidates: z.array(tierEntrySchema).optional(),
});

const hydratedObjectSchema = z.looseObject({
  stix: z.looseObject({}),
  workspace: z.looseObject({}).optional(),
});

const exportOptionsSchema = z
  .looseObject({
    include: z.array(z.enum(['staged', 'candidates'])).optional(),
    state: z.array(z.enum(['work-in-progress', 'awaiting-review'])).optional(),
    stixVersion: z.enum(['2.0', '2.1']).default('2.1'),
    includeToc: z.boolean().default(true),
    attackSpecVersion: z.string().optional(),
    collectionObject: z.looseObject({}).optional(),
    collectionId: z.string().optional(),
    createdByRef: z.string().optional(),
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
// Helper: Build the x-mitre-collection table-of-contents (TOC) object
//
// The x-mitre-collection object is effectively a table of contents for the
// bundle. For release-track exports it is derived from the track/snapshot
// metadata rather than from user-supplied query parameters:
//   - id: stable per track (reuses the track UUID)
//   - x_mitre_version: the snapshot's tagged version, or '0.1' for drafts
//   - modified: the snapshot's modified timestamp
//   - x_mitre_contents: every bundle object except marking definitions,
//     which are recorded in object_marking_refs instead
// -----------------------------------------------------------------------------

function buildTocObject(snapshot, bundleObjects, options) {
  const trackUuid = snapshot.id.split('--')[1];

  const tocObject = {
    type: 'x-mitre-collection',
    id: options.collectionId || `x-mitre-collection--${trackUuid}`,
    x_mitre_attack_spec_version: options.attackSpecVersion,
    name: snapshot.name,
    x_mitre_version: snapshot.version || '0.1',
    description: snapshot.snapshot_description ?? snapshot.description,
    created_by_ref: options.createdByRef || snapshot.created_by_ref || '',
    created: options.created || snapshot.created || snapshot.modified,
    modified: options.modified || snapshot.modified,
    x_mitre_contents: [],
    object_marking_refs: [],
  };

  for (const bundleObject of bundleObjects) {
    if (bundleObject.type === 'marking-definition') {
      tocObject.object_marking_refs.push(bundleObject.id);
    } else {
      tocObject.x_mitre_contents.push({
        object_ref: bundleObject.id,
        object_modified: bundleObject.modified,
      });
    }
  }

  if (options.stixVersion === '2.1') {
    tocObject.spec_version = '2.1';
  }

  // Sort x_mitre_contents by id for deterministic output
  tocObject.x_mitre_contents.sort((x, y) => x.object_ref.localeCompare(y.object_ref));

  return tocObject;
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
//   - includeToc (default true): prepend an x-mitre-collection object derived
//     from the snapshot metadata for STIX 2.1; STIX 2.0 always omits it
//   - attackSpecVersion: x_mitre_attack_spec_version for the TOC object
//
// Notes are Workbench-native objects, not STIX objects, so they are never
// included in emitted bundles.
// -----------------------------------------------------------------------------

const bundleTransformSchema = exportInputSchema.transform((input) => {
  const {
    stixVersion,
    includeToc,
    attackSpecVersion,
    collectionObject,
    collectionId,
    createdByRef,
    bundleId,
  } = input.options;

  const objects = input.hydratedObjects
    .map((doc) => doc.stix)
    .filter((stixObject) => stixObject.type !== 'note');

  for (const stixObject of objects) {
    conformToStixVersion(stixObject, stixVersion);
  }

  // x-mitre-collection is a STIX 2.1 ATT&CK extension object. It must never be
  // emitted in a STIX 2.0 bundle, even when includeToc retains its default.
  if (includeToc && stixVersion === '2.1') {
    const tocObject = collectionObject
      ? structuredClone(collectionObject)
      : buildTocObject(input.snapshot, objects, {
          stixVersion,
          attackSpecVersion,
          collectionId,
          createdByRef,
        });
    conformToStixVersion(tocObject, stixVersion);
    objects.unshift(tocObject);
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
  buildTocObject,
};
