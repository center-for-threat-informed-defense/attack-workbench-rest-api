'use strict';

const mongoose = require('mongoose');

const collectionVersion = {
  collection_ref: { type: String, required: true },
  collection_modified: { type: Date, required: true },
};
const collectionVersionSchema = new mongoose.Schema(collectionVersion, { _id: false });

/**
 * Workspace property definition for most object types
 */
module.exports.common = {
  workflow: {
    state: {
      type: String,
      enum: ['work-in-progress', 'awaiting-review', 'reviewed', 'static'],
    },
    created_by_user_account: String,
  },
  attack_id: String,
  collections: [collectionVersionSchema],
};

// x-mitre-collection workspace structure

const exportData = {
  export_timestamp: Date,
  bundle_id: String,
};
const exportDataSchema = new mongoose.Schema(exportData, { _id: false });

const importError = {
  object_ref: { type: String, required: true },
  object_modified: { type: Date },
  error_type: { type: String, required: true },
  error_message: { type: String },
};
const importErrorSchema = new mongoose.Schema(importError, { _id: false });

/**
 * Workspace property definition for collection objects
 */
const importCategories = {
  additions: [String],
  changes: [String],
  minor_changes: [String],
  revocations: [String],
  deprecations: [String],
  supersedes_user_edits: [String],
  supersedes_collection_changes: [String],
  duplicates: [String],
  out_of_date: [String],
  errors: [importErrorSchema],
};

const importReferences = {
  additions: [String],
  changes: [String],
};

const reimportData = {
  imported: Date,
  import_categories: importCategories,
  import_references: importReferences,
};

module.exports.collection = {
  imported: Date,
  exported: [exportDataSchema],
  import_categories: importCategories,
  import_references: importReferences,
  reimports: [reimportData],
  workflow: {
    state: {
      type: String,
      enum: ['work-in-progress', 'awaiting-review', 'reviewed'],
    },
    created_by_user_account: String,
    release: Boolean,
  },
};
