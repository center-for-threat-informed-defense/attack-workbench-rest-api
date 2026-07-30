'use strict';

// Authoritative hydration and existence validation for release-track primary
// content. Cross-service reads are intentionally centralized here so ingress,
// release planning, virtual materialization, import, and export share one
// exact-revision invariant.

const types = require('../../lib/types');
const revisionReference = require('../../lib/release-tracks/revision-reference');
const { InvalidObjectRevisionError, ReleaseContentIntegrityError } = require('../../exceptions');

let repositoryMap;

function getRepositoryMap() {
  if (repositoryMap) return repositoryMap;

  repositoryMap = {
    [types.Technique]: require('../../repository/techniques-repository'),
    [types.Tactic]: require('../../repository/tactics-repository'),
    [types.Group]: require('../../repository/groups-repository'),
    [types.Campaign]: require('../../repository/campaigns-repository'),
    [types.Mitigation]: require('../../repository/mitigations-repository'),
    [types.Matrix]: require('../../repository/matrix-repository'),
    [types.Relationship]: require('../../repository/relationships-repository'),
    [types.MarkingDefinition]: require('../../repository/marking-definitions-repository'),
    [types.Identity]: require('../../repository/identities-repository'),
    [types.Note]: require('../../repository/notes-repository'),
    [types.DataSource]: require('../../repository/data-sources-repository'),
    [types.DataComponent]: require('../../repository/data-components-repository'),
    [types.Asset]: require('../../repository/assets-repository'),
    [types.Analytic]: require('../../repository/analytics-repository'),
    [types.DetectionStrategy]: require('../../repository/detection-strategies-repository'),
  };

  const softwareRepo = require('../../repository/software-repository');
  repositoryMap[types.Malware] = softwareRepo;
  repositoryMap[types.Tool] = softwareRepo;

  return repositoryMap;
}

function revisionKey(entry) {
  return `${entry.object_ref}::${revisionReference.modifiedKey(entry.object_modified)}`;
}

function serializeReference(entry) {
  const modified = new Date(entry.object_modified);
  return {
    object_ref: entry.object_ref,
    object_modified: Number.isNaN(modified.getTime())
      ? String(entry.object_modified)
      : modified.toISOString(),
  };
}

function uniqueEntries(entries) {
  const seen = new Set();
  return entries.filter((entry) => {
    const key = revisionKey(entry);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Resolve dynamic selectors and hydrate every unique exact revision.
 * Repository failures deliberately propagate; only a successful query with a
 * missing result is classified as unresolved primary content.
 */
async function hydrateEntries(entries) {
  if (!entries || entries.length === 0) {
    return { entries: [], documents: [], missing: [] };
  }

  const resolvedEntries = uniqueEntries(await revisionReference.resolveEntries(entries));
  const byType = new Map();
  for (const entry of resolvedEntries) {
    const type = entry.object_ref.split('--')[0];
    if (!byType.has(type)) byType.set(type, []);
    byType.get(type).push(entry);
  }

  const documentsByRevision = new Map();
  const unsupported = [];
  const repositories = getRepositoryMap();

  await Promise.all(
    Array.from(byType.entries()).map(async ([type, refs]) => {
      const repository = repositories[type];
      if (!repository) {
        unsupported.push(...refs);
        return;
      }

      const documents = await repository.findManyByIdAndModified(refs);
      for (const document of documents) {
        documentsByRevision.set(
          revisionKey({
            object_ref: document.stix.id,
            object_modified: document.stix.modified,
          }),
          document,
        );
      }
    }),
  );

  const missing = [
    ...unsupported,
    ...resolvedEntries.filter((entry) => !documentsByRevision.has(revisionKey(entry))),
  ]
    .filter(
      (entry, index, all) =>
        all.findIndex((item) => revisionKey(item) === revisionKey(entry)) === index,
    )
    .map(serializeReference);
  const documents = resolvedEntries
    .map((entry) => documentsByRevision.get(revisionKey(entry)))
    .filter(Boolean);

  return { entries: resolvedEntries, documents, missing };
}

async function assertRequestEntries(entries) {
  const result = await hydrateEntries(entries);
  if (result.missing.length > 0) {
    throw new InvalidObjectRevisionError(result.missing);
  }
  return result;
}

async function assertStoredEntries(entries) {
  const result = await hydrateEntries(entries);
  if (result.missing.length > 0) {
    throw new ReleaseContentIntegrityError(result.missing);
  }
  return result;
}

module.exports = {
  getRepositoryMap,
  hydrateEntries,
  assertRequestEntries,
  assertStoredEntries,
  _private: {
    revisionKey,
    serializeReference,
    uniqueEntries,
  },
};
