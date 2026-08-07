'use strict';

// =============================================================================
// STIX version conformance helpers.
//
// Shared by the legacy stix-bundles-service and the release-tracks export
// pipeline so that every emitted bundle applies identical version rules:
//   - STIX 2.0: objects must not have spec_version; malware/tool need labels
//   - STIX 2.1: objects must have spec_version; labels are dropped except on
//     course-of-action objects
// =============================================================================

/**
 * Removes empty array properties from a STIX object.
 * @param {Object} stixObject - The STIX object to clean
 */
function removeEmptyArrays(stixObject) {
  for (const propertyName of Object.keys(stixObject)) {
    if (Array.isArray(stixObject[propertyName]) && stixObject[propertyName].length === 0) {
      delete stixObject[propertyName];
    }
  }
}

/**
 * Modifies a STIX object in place to conform to the specified STIX version
 * ('2.0' or '2.1'). Handles version-specific requirements for various object
 * types.
 * @param {Object} stixObject - The STIX object to modify
 * @param {string} stixVersion - Target STIX version ('2.0' or '2.1')
 */
function conformToStixVersion(stixObject, stixVersion) {
  if (stixVersion === '2.0') {
    // Remove STIX 2.1 specific properties
    delete stixObject.spec_version;

    // Handle malware and tool specific requirements
    if (stixObject.type === 'malware') {
      delete stixObject.is_family;
      stixObject.labels = ['malware'];
    }

    if (stixObject.type === 'tool') {
      stixObject.labels = ['tool'];
    }
  } else if (stixVersion === '2.1') {
    stixObject.spec_version = '2.1';
    if (stixObject.type != 'course-of-action') {
      delete stixObject.labels;
    }
  }

  removeEmptyArrays(stixObject);
}

module.exports = {
  removeEmptyArrays,
  conformToStixVersion,
};
