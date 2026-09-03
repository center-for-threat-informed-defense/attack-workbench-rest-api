'use strict';

// =============================================================================
// Mongoose custom validators for release track model schemas.
//
// Each export is a { validator, message } object compatible with Mongoose's
// custom validator interface. Internally they delegate to the Zod schemas
// defined in ./release-track-schemas.js.
//
// See: https://mongoosejs.com/docs/validation.html#custom-validators
// =============================================================================

const {
  releaseTrackIdSchema,
  trackNameSchema,
  cronSchema,
  snapshotScheduleSchema,
  objectTypesFilterSchema,
  stixIdentifierSchema,
  xMitreVersionSchema,
  createStixIdValidator,
  trackAliasSchema,
} = require('./release-track-schemas');

// -----------------------------------------------------------------------------
// Mongoose validators
// -----------------------------------------------------------------------------

const validateTrackId = {
  validator: (v) => releaseTrackIdSchema.safeParse(v).success,
  message: (props) =>
    `"${props.value}" is not a valid release track ID (expected "release-track--<uuid>")`,
};

const validateTrackAlias = {
  validator: (v) => v === undefined || trackAliasSchema.safeParse(v).success,
  message: (props) => `"${props.value}" is not a valid release track alias`,
};

const validateTrackName = {
  validator: (v) => trackNameSchema.safeParse(v).success,
  message: (props) =>
    `"${props.value}" is not a valid release track name ` +
    '(only alphanumeric characters, spaces, and ampersands allowed)',
};

const validateStixId = {
  validator: (v) => stixIdentifierSchema.safeParse(v).success,
  message: (props) => `"${props.value}" is not a valid STIX ID (expected "<type>--<uuid>")`,
};

const validateIdentityRef = {
  validator: (v) => createStixIdValidator('identity').safeParse(v).success,
  message: (props) =>
    `"${props.value}" is not a valid identity reference (expected "identity--<uuid>")`,
};

const validateCollectionId = {
  validator: (v) => createStixIdValidator('x-mitre-collection').safeParse(v).success,
  message: (props) =>
    `"${props.value}" is not a valid collection identifier (expected "x-mitre-collection--<uuid>")`,
};

const validateMarkingDefRefs = {
  validator: (v) =>
    v.every((ref) => createStixIdValidator('marking-definition').safeParse(ref).success),
  message: () =>
    'Each marking reference must be a valid marking-definition ID (expected "marking-definition--<uuid>")',
};

const validateVersion = {
  validator: (v) => v === null || xMitreVersionSchema.safeParse(v).success,
  message: (props) =>
    `"${props.value}" is not a valid version (expected MAJOR.MINOR format, e.g. "1.0")`,
};

const validateCron = {
  validator: (v) => cronSchema.safeParse(v).success,
  message: (props) => `"${props.value}" is not a valid cron expression (expected 5 fields)`,
};

const validateSnapshotSchedule = {
  validator: (value) => {
    if (value === undefined || value === null) return true;

    const schedule = typeof value.toObject === 'function' ? value.toObject() : value;
    const normalized = {
      ...schedule,
      dates: schedule.dates?.map((date) => (date instanceof Date ? date.toISOString() : date)),
    };
    if (normalized.dates === undefined) delete normalized.dates;

    return snapshotScheduleSchema.safeParse(normalized).success;
  },
  message:
    'Snapshot schedule fields must match mode: manual has no selector, cron requires cron, and dates requires at least one date',
};

const validateObjectTypesFilter = {
  validator: (value) =>
    value === undefined ||
    (Array.isArray(value) && objectTypesFilterSchema.safeParse(value).success),
  message:
    'Object type filters must be a non-empty, duplicate-free list of supported Workbench STIX types',
};

// =============================================================================
// Exports
// =============================================================================

module.exports = {
  validateTrackId,
  validateTrackAlias,
  validateTrackName,
  validateStixId,
  validateIdentityRef,
  validateMarkingDefRefs,
  validateCollectionId,
  validateVersion,
  validateCron,
  validateSnapshotSchedule,
  validateObjectTypesFilter,
};
