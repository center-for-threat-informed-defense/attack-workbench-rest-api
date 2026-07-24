'use strict';

// A released/member pin is authoritative over workflow and quarantine pins.
// This order also matches backref reconciliation's long-standing defensive
// "first tier wins" behavior.
const TIER_PRECEDENCE = ['members', 'staged', 'candidates', 'quarantine'];

function modifiedKey(value) {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? String(value) : String(timestamp);
}

/**
 * Build the identity key for a pinned STIX revision.
 *
 * @param {Object} entry
 * @returns {string}
 */
function revisionKey(entry) {
  return `${entry.object_ref}\u0000${modifiedKey(entry.object_modified)}`;
}

/**
 * Compare two tier entries by their pinned STIX revision.
 *
 * @param {Object} left
 * @param {Object} right
 * @returns {boolean}
 */
function sameRevision(left, right) {
  return revisionKey(left) === revisionKey(right);
}

/**
 * Remove exact revision duplicates that occur in different snapshot tiers.
 *
 * Different revisions of one object remain valid across tiers. Duplicate
 * entries within one tier are left intact because quarantine entries can
 * intentionally retain per-source provenance.
 *
 * @param {Object} snapshot
 * @returns {{snapshot: Object, removed: Array<Object>, changedTiers: Set<string>}}
 */
function normalizeSnapshot(snapshot) {
  const normalized = { ...snapshot };
  const firstTierByRevision = new Map();
  const removed = [];
  const changedTiers = new Set();

  for (const tier of TIER_PRECEDENCE) {
    const entries = snapshot[tier];
    if (!Array.isArray(entries)) continue;

    const kept = [];
    for (const entry of entries) {
      const key = revisionKey(entry);
      const incumbentTier = firstTierByRevision.get(key);

      if (incumbentTier && incumbentTier !== tier) {
        removed.push({
          object_ref: entry.object_ref,
          object_modified: entry.object_modified,
          kept_tier: incumbentTier,
          removed_tier: tier,
        });
        changedTiers.add(tier);
        continue;
      }

      if (!incumbentTier) {
        firstTierByRevision.set(key, tier);
      }
      kept.push(entry);
    }

    if (changedTiers.has(tier)) {
      normalized[tier] = kept;
    }
  }

  return { snapshot: normalized, removed, changedTiers };
}

module.exports = {
  TIER_PRECEDENCE,
  revisionKey,
  sameRevision,
  normalizeSnapshot,
};
