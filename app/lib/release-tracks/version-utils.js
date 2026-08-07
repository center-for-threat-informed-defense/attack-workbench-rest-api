'use strict';

// =============================================================================
// Version Utilities
//
// Parsing, comparison, calculation, and validation for MAJOR.MINOR version
// strings used by release track tagging.
//
// ATT&CK release tracks use a two-part versioning scheme (MAJOR.MINOR),
// not three-part semver. See docs/COLLECTIONS_V2/03_VERSIONING.md.
// =============================================================================

const { InvalidVersionError } = require('../../exceptions');

const VERSION_PATTERN = /^\d+\.\d+$/;

/**
 * Parse a version string into its numeric components.
 *
 * @param {string} str - Version string in "MAJOR.MINOR" format
 * @returns {{ major: number, minor: number }}
 * @throws {InvalidVersionError} If the string is not a valid version
 */
exports.parseVersion = function parseVersion(str) {
  if (!str || !VERSION_PATTERN.test(str)) {
    throw new InvalidVersionError(`Invalid version format: "${str}" (expected MAJOR.MINOR)`);
  }
  const [major, minor] = str.split('.').map(Number);
  return { major, minor };
};

/**
 * Compare two version strings.
 *
 * @param {string} a - First version
 * @param {string} b - Second version
 * @returns {number} -1 if a < b, 0 if a === b, 1 if a > b
 */
exports.compareVersions = function compareVersions(a, b) {
  const va = exports.parseVersion(a);
  const vb = exports.parseVersion(b);

  if (va.major !== vb.major) return va.major < vb.major ? -1 : 1;
  if (va.minor !== vb.minor) return va.minor < vb.minor ? -1 : 1;
  return 0;
};

/**
 * Find the exclusive semantic-version bounds around a snapshot timestamp.
 * Tagged snapshots without modified metadata are treated as legacy lower
 * bounds so internal callers using the older history shape remain safe.
 *
 * @param {Array<{ version: string, modified?: string|Date }>} versionHistory
 * @param {string|Date} [sourceModified]
 * @returns {{ lower: Object|null, upper: Object|null }}
 */
exports.findVersionBounds = function findVersionBounds(versionHistory, sourceModified) {
  const history = versionHistory || [];
  const sourceTime = sourceModified == null ? NaN : new Date(sourceModified).getTime();
  const timestamped = history.filter(
    (entry) => entry.modified != null && !Number.isNaN(new Date(entry.modified).getTime()),
  );

  if (Number.isNaN(sourceTime) || timestamped.length !== history.length) {
    let highest = null;
    for (const entry of history) {
      if (!highest || exports.compareVersions(entry.version, highest.version) > 0) {
        highest = entry;
      }
    }
    return { lower: highest, upper: null };
  }

  let lower = null;
  let upper = null;
  for (const entry of timestamped) {
    const entryTime = new Date(entry.modified).getTime();
    if (entryTime < sourceTime && (!lower || entryTime > new Date(lower.modified).getTime())) {
      lower = entry;
    }
    if (entryTime > sourceTime && (!upper || entryTime < new Date(upper.modified).getTime())) {
      upper = entry;
    }
  }

  return { lower, upper };
};

/**
 * Calculate the next version based on the nearest chronologically preceding
 * tagged snapshot and release increment.
 *
 * If an explicit version is provided, it is returned as-is (validation
 * is handled separately by validateVersionProgression).
 *
 * Increment and explicit version selectors are mutually exclusive.
 *
 * If the version history is empty, the first version defaults to "1.0".
 *
 * @param {Array<{ version: string, modified?: string|Date }>} versionHistory - Existing tagged snapshots
 * @param {string} [increment='minor'] - 'major' or 'minor'
 * @param {string} [explicitVersion] - Explicit version override
 * @param {string|Date} [sourceModified] - Snapshot being tagged
 * @returns {string} The calculated version string
 * @throws {InvalidVersionError} If both selectors are supplied or the explicit
 * version is invalid
 */
exports.calculateNextVersion = function calculateNextVersion(
  versionHistory,
  increment,
  explicitVersion,
  sourceModified,
) {
  if (increment && explicitVersion) {
    throw new InvalidVersionError('increment and version are mutually exclusive');
  }

  if (explicitVersion) {
    // Validate format only; monotonicity is checked by validateVersionProgression
    exports.parseVersion(explicitVersion);
    return explicitVersion;
  }

  const { lower } = exports.findVersionBounds(versionHistory, sourceModified);
  if (!lower) {
    return '1.0';
  }

  const { major, minor } = exports.parseVersion(lower.version);
  const type = increment || 'minor';

  return type === 'major' ? `${major + 1}.0` : `${major}.${minor + 1}`;
};

/**
 * Validate that a version is unique and lies strictly between the nearest
 * tagged snapshots before and after the snapshot being released.
 *
 * @param {string} newVersion - The version to validate
 * @param {Array<{ version: string, modified?: string|Date }>} versionHistory - Existing tagged snapshots
 * @param {string|Date} [sourceModified] - Snapshot being tagged
 * @throws {InvalidVersionError} If the version is duplicated or outside its bounds
 */
exports.validateVersionProgression = function validateVersionProgression(
  newVersion,
  versionHistory,
  sourceModified,
) {
  exports.parseVersion(newVersion);
  if (!versionHistory || versionHistory.length === 0) {
    return;
  }

  for (const entry of versionHistory) {
    if (exports.compareVersions(newVersion, entry.version) === 0) {
      throw new InvalidVersionError(
        `Version "${newVersion}" is already assigned to another snapshot in this release track`,
      );
    }
  }

  const { lower, upper } = exports.findVersionBounds(versionHistory, sourceModified);
  if (lower && upper && exports.compareVersions(lower.version, upper.version) >= 0) {
    throw new InvalidVersionError(
      `Cannot tag this snapshot because surrounding versions "${lower.version}" and ` +
        `"${upper.version}" are not chronologically increasing`,
    );
  }
  if (lower && exports.compareVersions(newVersion, lower.version) <= 0) {
    throw new InvalidVersionError(
      `Version "${newVersion}" must be greater than preceding version "${lower.version}"`,
    );
  }
  if (upper && exports.compareVersions(newVersion, upper.version) >= 0) {
    throw new InvalidVersionError(
      `Version "${newVersion}" must be less than following version "${upper.version}"`,
    );
  }
};
