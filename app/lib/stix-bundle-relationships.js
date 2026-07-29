'use strict';

/**
 * Relationship patterns that are intentionally excluded from published
 * ATT&CK bundles.
 */
const DEPRECATED_PATTERNS = Object.freeze([
  {
    type: 'relationship',
    conditions: {
      relationship_type: 'detects',
      sourceTypePrefix: 'x-mitre-data-component--',
    },
    reason: 'Data components cannot detect techniques in v17+ (only detection strategies can)',
  },
]);

function isDeprecatedPattern(stixObject) {
  return DEPRECATED_PATTERNS.some((pattern) => {
    if (stixObject.type !== pattern.type) return false;

    return Object.entries(pattern.conditions).every(([key, value]) => {
      if (key === 'sourceTypePrefix') {
        return stixObject.source_ref?.startsWith(value);
      }
      return stixObject[key] === value;
    });
  });
}

function relationshipIsActive(relationship) {
  return !relationship.stix.x_mitre_deprecated && !relationship.stix.revoked;
}

/**
 * Return relationships that are publishable and whose endpoints are both
 * present in the selected object set.
 *
 * @param {Array<Object>} relationships - Lean relationship documents
 * @param {Set<string>|Map<string, unknown>} selectedObjects - Selected STIX IDs
 * @returns {Array<Object>} Publishable relationship documents
 */
function selectRelationshipsForBundle(relationships, selectedObjects) {
  return relationships.filter(
    (relationship) =>
      relationshipIsActive(relationship) &&
      !isDeprecatedPattern(relationship.stix) &&
      selectedObjects.has(relationship.stix.source_ref) &&
      selectedObjects.has(relationship.stix.target_ref),
  );
}

module.exports = {
  DEPRECATED_PATTERNS,
  isDeprecatedPattern,
  relationshipIsActive,
  selectRelationshipsForBundle,
};
