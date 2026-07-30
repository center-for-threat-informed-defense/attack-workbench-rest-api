'use strict';

const objectResolver = require('./object-resolver');
const { BadRequestError } = require('../../exceptions');

const LATEST = 'latest';

function isLatest(value) {
  return value === LATEST;
}

function normalize(value) {
  return isLatest(value) ? LATEST : new Date(value);
}

function modifiedKey(value) {
  if (isLatest(value)) return LATEST;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? String(value) : String(timestamp);
}

function sameModified(left, right) {
  return modifiedKey(left) === modifiedKey(right);
}

/**
 * Compare two exact or dynamic revision selectors.
 *
 * A dynamic `latest` selector is at least as recent as every exact revision
 * that currently exists, so it wins `prefer_latest` comparisons against an
 * exact selector. Two dynamic selectors compare equally.
 */
function compareModified(left, right) {
  if (isLatest(left)) return isLatest(right) ? 0 : 1;
  if (isLatest(right)) return -1;
  return new Date(left).getTime() - new Date(right).getTime();
}

/**
 * Resolve dynamic entries without mutating the stored snapshot representation.
 *
 * @param {Array<Object>} entries
 * @param {Map<string, Promise<Date>>} [latestByObjectRef]
 * @returns {Promise<Array<Object>>}
 */
async function resolveEntries(entries, latestByObjectRef = new Map()) {
  const resolveLatest = (objectRef) => {
    if (!latestByObjectRef.has(objectRef)) {
      latestByObjectRef.set(objectRef, objectResolver.resolveLatestModified(objectRef));
    }
    return latestByObjectRef.get(objectRef);
  };

  return Promise.all(
    (entries || []).map(async (entry) => {
      const objectModified = isLatest(entry.object_modified)
        ? await resolveLatest(entry.object_ref)
        : new Date(entry.object_modified);

      if (!(objectModified instanceof Date) || Number.isNaN(objectModified.getTime())) {
        throw new BadRequestError({
          message: 'Invalid release-track revision selector',
          details:
            `Object "${entry.object_ref}" must reference "latest" or a valid ` +
            'object_modified timestamp',
        });
      }

      return {
        ...entry,
        object_modified: objectModified,
      };
    }),
  );
}

module.exports = {
  LATEST,
  isLatest,
  normalize,
  modifiedKey,
  sameModified,
  compareModified,
  resolveEntries,
};
