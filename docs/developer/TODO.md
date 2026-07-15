# Release Track TODOs

## Regression Tests

- [ ] Implement regression tests

- [x] **Investigate the recurring full-suite flake.** Two root causes found and fixed (2026-07-10) in `app/lib/database-in-memory.js`:
  1. *Port collision*: every spec file stopped and restarted the `mongodb-memory-server` instance, and a fresh mongod would intermittently fail with `Port already in use` — breaking that file's `before` hook (surfacing as `loginAnonymous` 404s) and cascading failures through the file. Fixed by reusing one mongod for all spec files in the process (`closeConnection` drops the database and disconnects but keeps the server running) plus `--exit` on the mocha scripts.
  2. *Vanishing unique indexes*: dropping the database between spec files also drops its indexes, and mongoose's per-model `init()` is memoized per process — so the `stix.id + stix.modified` unique index was intermittently missing for later files, letting duplicate-POST tests (and dependent count tests) fail in roaming pairs. Fixed by explicitly awaiting `createIndexes()` for all registered models after each reconnect.

  Residual: rare (≈1 per run under heavy machine load) single-test failures of a different character (a count assertion, a 20s timeout in a pagination GET) still appear occasionally and pass in isolation — likely load-related; keep observing before chasing further.


## Snapshot Output Format

**TASK Summary**: Implement support for the `bundle` output format for snapshots

`bundle` refers to a STIX 2.1 bundle that contains all of the objects in the snapshot. The bundle should be emitted as a JSON object with the following structure:

```json
{
  "type": "bundle",
  "id": "bundle--<UUID>",
  "spec_version": "2.0", // omit if STIX 2.1, include for STIX 2.0
  "objects": [
    // All objects in the snapshot
  ]
}
```

The following release-track snapshot retrieval endpoints support `include` and
`format` query parameters:

- `GET /api/release-tracks/:id` (get latest snapshot)
- `GET /api/release-tracks/:id/snapshots/:modified` (get specific snapshot)

> [!Note]
> The ephemeral bundle endpoint (`GET /api/release-tracks/ephemeral/{domain}`) supports `format`, but not tier `include`, because it does not read from a persisted release-track snapshot. Rather, it "blindly" includes all objects in the domain.


**Include Parameter** (controls which tiers are returned):
```
GET /api/release-tracks/:id                            # Default: all tiers
GET /api/release-tracks/:id?include=members            # Members tier only
GET /api/release-tracks/:id?include=staged             # Members and staged tiers
GET /api/release-tracks/:id?include=candidates         # Members and candidates tiers
GET /api/release-tracks/:id?include=quarantine         # Members and quarantine tiers
GET /api/release-tracks/:id?include=all                # All tiers
```

**Format Parameter** (controls output format):
```
GET /api/release-tracks/:id?format=workbench           # Workbench snapshot with metadata (default)
GET /api/release-tracks/:id?format=bundle              # Standard STIX 2.1 bundle
GET /api/release-tracks/:id?format=filesystemstore     # Not implemented; returns 501
```

**Combined Example:**
```
GET /api/release-tracks/:id?include=all&format=workbench
```

> [!Note]
> The `workbench` format is the default output format and is already implemented. The `bundle` format is a new output format that needs to be implemented. The `filesystemstore` format is not implemented and will return a 501 error if requested.

### Replacing the legacy `GET /api/stix-bundles` endpoint

Importantly, the release track retrieval method with `format=bundle` as well as the ephemeral bundle endpoint will supplant the `GET /api/stix-bundles/` endpoint defined in `stix-bundles-routes.js`. The `stix-bundles` endpoint will be deprecated and removed in a future release. We thus need to inspect the `stix-bundles-controller.js` module and identify any logic that needs to be preserved with respect to preserving existing functionality in the new endpoints.

The `stix-bundles` endpoint currently supports generating a `x-mitre-collection` object that is emitted in the bundle. We need to ensure that this functionality is preserved in the new endpoints. Users specify how the `x-mitre-collection` object is generated via the `includeCollectionObject`, `collectionObjectVersion`, `collectionObjectModified`, and `collectionAttackSpecVersion` query parameters. We can simplify this functionality in the new endpoints:

- `collectionObjectVersion` can just default to `v0.1` to signify that the collection was generated ephemerally and is not connected to a particular release track.
- `collectionObjectModified` can default to the current timestamp.
- `collectionAttackSpecVersion` can default to the global default attack spec version (tracked in `config.js` and exposed via `app.attackSpecVersion`).
- The `includeCollectionObject` parameter can be renamed to `includeToc` to signify that the user wants to include a table of contents object in the bundle (which is what the `x-mitre-collection` object effectively is; moreover, the term, "collection", is oversaturated in the context of STIX and Workbench, so this renaming will help reduce confusion). The `includeToc` parameter can default to `true`.

Here is how each of the other query parameters should be handled/mapped to the newer ephemeral bundle retrieval endpoint (`/api/release-tracks/ephemeral/{domain}`):

- `includeNotes` can be **removed**. We originally implemented notes in Workbench such that they could be included in emitted STIX bundles because we treat notes as STIX objects. However, this concept never really took off, and we have decided to treat notes as second-class Workbench-native objects that are not STIX objects, and thus cannot be included in emitted STIX bundles.
- `includeMissingAttackId` should be **preserved** as `includeObjectsWithMissingAttackId`. This parameter allows users to control whether or not objects without ATT&CK IDs are included in the emitted bundle. It defaults to `false`.
- `stixVersion` should be **preserved**. This parameter allows users to control which STIX version is used in the emitted bundle (`2.0` or `2.1`). It defaults to `2.1`.
- `useLegacyMethod` should be **removed**. The `stix-bundles-service.js` module has a legacy method for generating STIX bundles that we no longer use. The new endpoints should not support this legacy method, and thus this parameter can be removed.
- `includeDataSources` should be **removed**. For context, Data Sources are officially considered a deprecated concept in ATT&CK as of ATT&CK Spec v3.3.0. They were marked as either deprecated or revoked in the corresponding ATT&CK content release (v18.0). Because we already have `includeDeprecated` and `includeRevoked` query parameters, we can remove `includeDataSources` and instead rely on the `includeDeprecated` and `includeRevoked` query parameters to control whether or not deprecated/revoked Data Sources are included in the emitted bundle. This will simplify the API and reduce confusion.
- `state` can be **removed**. The `state` parameter was originally implemented to allow users to control which objects are included based on their workflow status (`work-in-progress`, `awaiting-review`, `reviewed`). Before the introduction of release tracks, workflow status was globally scoped. Now, with release tracks, workflow status is scoped to a release track. The ephemeral bundle endpoint is domain scoped, not release-track scoped, and thus it does not have a concept of workflow status. The `state` parameter can be removed from the new endpoints.

### Updates to the release-track retrieval endpoints

For release track retrieval requests that include the `format=bundle` query parameter, the following query parameters must be supported:

- `include: ['candidate', 'staged']`: If specified, the value must be equal to an array of at least one value. The parameter acts as a filter, allowing users to specify whether release-track candidates and/or staged objects should be included in the bundle. If the `include` parameter is omitted, only members should be included.
- `state: ['work-in-progress', 'awaiting-review']`: If specified, the value must be equal to an array of at least one value. Notably, objects marked as `"reviewed"` are always included (by nature of all members being included —— all members are inherently "reviewed"), irrespective of this query parameter. The parameter acts as a union filter that logically combines with `include`. In other words, when `include` and `state` are both specified, `include` is applied first, then `state` is applied to the remaining `include`-filtered subset. (i.e., Of the candidates and/or staged objects that are ready to be included in the emitted bundle, only include the ones that are marked as "work-in-progress", "awaiting-review", or either). 
- `stixVersion` should be **preserved**. This parameter allows users to control which STIX version is used in the emitted bundle (`2.0` or `2.1`). It defaults to `2.1`.

### In Summary:

- [x] Read the existing release track user + developer documentation in `docs/user/release-tracks/` and `docs/developer/release-tracks/`, respectively.
- [x] Review the new `GET /api/release-tracks/ephemeral/:domain` endpoint implementation as well as the legacy `GET /api/stix-bundles` endpoint.
- [x] Implement support for the `format=bundle` query parameter in the following two endpoints:
  - `GET /api/release-tracks/:id` (get latest snapshot)
  - `GET /api/release-tracks/:id/snapshots/:modified` (get specific snapshot)
- [x] Ensure that all required logic (query parameters) is/are implemented in the new endpoints as outlined above.
- [x] Implement regression tests for the new functionality (`release-tracks-bundle.spec.js`, `ephemeral-bundle.spec.js`)
- [x] Update the aforementioned user + developer documentation. The user documentation should simply describe how the behavior _is_ while the developer documentation should described _why_ and _how_, and additionally cover what has been described here: explaining what _was_ and how the functionality has evolved from before the introduction of release tracks to after. (See `docs/developer/release-tracks/bundle-export.md`.)


## Bidirectional References

- [x] Implement bidirectional refs between objects and snapshots. Users should be able to get individual objects via standard getters (e.g., `GET /api/techniques/:id`) and see which snapshots they are part of in the object's metadata.

> **Implemented** as `workspace.release_tracks` (`[{ id, tier, status }]`, tiers `members`/`staged`/`candidates`/`quarantine` — matching the snapshot tier array names; the sketch below predates the rename of `phase` → `tier`), maintained via snapshot-driven reconciliation over the `release-track::contents-changed` EventBus event. See `docs/developer/release-tracks/backref-reconciliation.md` (why/how) and `docs/user/release-tracks/object-backrefs.md` (behavior). Regression tests: `app/tests/api/release-tracks/release-tracks-backrefs.spec.js`.

Currently, it is impossible to delineate which release tracks (if any) an object belongs to _from the object's perspective_. By "the object's perspective", I mean from a given STIX object document in the `attackObjects` Mongo collection —— you cannot look at a document in the `attackObjects` collection and see which release track(s) the object is a part of. Instead, you must scan all existing release tracks for the object's `stix.id` value in either the `candidates`, `staged`, `members`, or `quarantine` list.

This is easily correctable. When an object is either added or removed from a release track, the object document should be updated. We just need to include a small piece of metadata in the STIX object's document. Fortunately, we already have a pattern in place for tracking metadata: `workspace`. Moreover, we actually have an equivalent bidirectional ref tracker in place for the release tracks' predecessor: Workbench collections. They are/were tracked in each object's `workspace.collection` field. So, we may be able to copy/mimic this existing workflow.

I am imagining STIX object documents containing backwards pointers to their containing release track(s) looking something like this:

```yaml
# A Technique document
workspace:
    release_tracks:
        - id: String
          phase: String; Options: ['candidate', 'staged', 'member']
          status: String; Options: ['work-in-progress', 'awaiting-review', or 'reviewed']
stix: # ...
```

For example:

```yaml
workspace:
    release_tracks:
        - id: 'release-track--3a0e2537-1153-4b16-8ff5-1993f2d9cd7d'
          phase: 'candidate'
          status: 'work-in-progress'
stix: # ...
```

The `phase` and `status` fields will need to change for the appropriate `release_tracks` list element when user moves the object between the candidate, staged, and member phases; and when the object's status changes. We can make use of the event bus architecture here, following the same pattern that some services (like `detection-strategies-service.js` and `analytics-service.js`) use to track embedded relationships between two objects. Similarly, the release tracks service would just need to fire off an event that each of the STIX services listen; and when heard, they set the `workspace.release_tracks` field for the relevant STIX object document(s) accordingly.

## Release-Track Change Capture (in-place mutation hardening)

Object CRUD paths can mutate or destroy revisions that release tracks pin, without the track ever hearing about it. Design decisions locked in 2026-07-10. The `workspace.release_tracks` backrefs make every guard below a cheap document-local check (no track scanning).

- [x] **Reject revision re-keying on PUT.** `updateFull` merged body `stix.id`/`stix.modified` over the stored document, so a PUT could silently re-key a revision and strand any track pins. Now returns 400 when the body identity fields differ from the path parameters. Re-keying must go through POST (a new revision), which member sync captures. Tests: `app/tests/api/base-services/update-identity-guard.spec.js`.

- [x] **Capture in-place PUTs of pinned revisions.** Implemented 2026-07-13: `BaseService.updateFull` rejects (409, `MemberPinnedRevisionError`) when the revision is pinned in any track's `members` tier — released content is immutable in place; POST a new revision instead. `staged`/`candidates`-pinned revisions ride the `::updated` → revision-sync path and are marked with the server-assigned **`modified-in-place`** status (content changed with no revision history to diff — reviewers are told *that* something changed, not *what*; the marker is cleared via the review endpoint). Placement is centralized in the **workflow gate** (`app/lib/release-tracks/workflow-gate.js`): tier is decided against `candidacy_threshold`/`auto_promote` (`modified-in-place` ranks with `work-in-progress`), so permissive tracks keep in-place-edited staged entries staged while strict tracks demote them for re-review — and threshold-qualifying placements land directly in `staged` in a single snapshot (no more candidates bounce). Covers in-place deprecation (`x_mitre_deprecated` via PUT). The member-sync misfire (same-key duplicate cross-tier enrollment) is fixed by skipping enrollment of already-pinned revisions and skipping no-op snapshot clones. Future: an in-document changelog of in-place modifications would let the marker say *what* changed. Tests: `app/tests/api/release-tracks/release-tracks-change-capture.spec.js`.

- [x] **DELETE of tracked objects.** Implemented 2026-07-13 with a simplified decision: DELETE (single version or all versions) is *rejected* (409) when a revision is `members`-pinned, with guidance to retire the object via a new `x_mitre_deprecated` revision instead — members-pinned revisions are immutable and must never be deleted. (The earlier auto-convert-to-deprecation idea was dropped in favor of explicit rejection.) `candidates`/`staged`-pinned deletes remain allowed (the reconciler self-heals the dangling pin). Note: `CollectionsService` overrides `deleteVersionById`, so collections are not covered by the guard. Legacy delete controllers were migrated to the service-exception middleware (`next(err)`) so the 409 maps correctly.

- [x] **Revoke must reach member sync.** Implemented 2026-07-13: member sync subscribes to the 11 per-type `::revoked` events via a payload adapter (`handleStixObjectRevokedEvent`), so the revoked revision (`revoked: true`) is enrolled as a candidate in member tracks and candidate/staged pins move to it — treated exactly like any new revision. The revoke response's primary document carries the resulting backrefs. As decided, member sync is NOT extended to relationships: the revoked-by SRO and deprecation clones are pulled in dynamically at bundle export.

- [x] **Technique conversion should reach revision sync.** Implemented 2026-07-13 with the adapter approach (same pattern as `handleStixObjectRevokedEvent`): the `TECHNIQUE_CONVERTED_TO_SUBTECHNIQUE` / `SUBTECHNIQUE_CONVERTED_TO_TECHNIQUE` event payloads now carry the converted revision (`document`) and acting user, and member sync subscribes via `handleStixObjectConvertedEvent`, treating the conversion as a `new-revision` trigger through the workflow gate — candidate/staged pins move to the converted revision, member tracks enroll it as a candidate. The conversion responses refresh `workspace.release_tracks` after event processing (read-your-own-writes). Tests: conversion cases in `release-tracks-change-capture.spec.js` and the updated clone-strip test in `release-tracks-backrefs.spec.js`.

## Small Fixes

- [ ] **Composition schema mismatch: `priority`.** `PUT /api/release-tracks/:id/composition` — the Zod schema (`componentTrackSchema`) marks `priority` optional, but the mongoose snapshot schema requires it, so omitting it passes validation and then fails the save with a 500 (`DatabaseError`) instead of a 400. Align the schemas (either default `priority` or make it required in Zod). Found 2026-07-15 while testing virtual-track backrefs.

## Diffing Endpoint

- [ ] Implement object diffing endpoints for snapshots. Users should be able to effectively preview changes to objects before tier transitions (candidates, staged, members).

### Idea 1 - Diffing endpoint specifically for release tracks 

In this approach, we would implement a workflow-driven diffing endpoint that is specific to release tracks. The endpoint would allow users to diff objects in the candidate snapshot against their previous revisions in the staged or member snapshots.

```
GET /api/release-tracks/:id/candidates/:objectRef/diff
GET /api/release-tracks/:id/staged/:objectRef/diff
```

If `:objectRef` is a reference to an object that is not part of the candidate snapshot, the endpoint should return a 404 error. If it is part of the candidate snapshot, the endpoint should return a diff between the object in the candidate snapshot and the object in the next lifecycle stage.

To clarify, snapshot objects transition linearly and unidirectionally through the following tier transitions: Candidate -> Staged -> Member

An object exists as a set of one or more revisions. An object is identified by its `stix.id` field, whereas an object revision is identified by its `stix.id` and `stix.modified` fields. 

A revision can exist in exactly one tier at a time.

- If a revision exists in the candidate snapshot, it will not exist in the staged or member snapshots.
- If it exists in the staged snapshot, it will not exist in the candidate or member snapshots. 
- If it exists in the member snapshot, it will not exist in the candidate or staged snapshots.

If a revision exists in the candidate snapshot, it will not exist in the staged or member snapshots. However, a _previous_ revision may exist in the staged or member tiers (though it is not guaranteed). Because the tier transitions are unidirectional, revisions must be temporally ordered as it relates to how they are distributed across the tiers. It should not be possible for a newer revision to exist in a previous tier. For example, if a revision exists in the candidate snapshot, it is not possible for a newer revision to exist in the staged or member snapshots.

This rigidity allows us to implement a diffing endpoint that is specific to release tracks. The diffing endpoint should return a diff between the candidate revision and the next lifecycle stage revision (staged or member).

So, if an object exists in the candidate snapshot, and another/previous revision of it exists in the members state, the diff endpoint should return a diff between the candidate revision and the member revision. If no previous revision exists in the members state, the diff endpoint should return a diff between the candidate revision and an empty object.

As another example, if an object exists in the staged tier, the `GET /api/release-tracks/:id/staged/:objectRef/diff` endpoint should return a diff between it and the previous revision that exists in the member tier. If no previous revision exists in the member state, the diff endpoint should return a diff between the candidate revision and an empty object.

Member revisions are considered immutable and thus cannot be diffed from. Hence, there is no `GET /api/release-tracks/:id/members/:objectRef/diff` endpoint.

There is one edge case that needs special consideration. If a revision exists as a candidate, a previous revision exists as a member, but no previous revision exists in the staged tier, the diff endpoint now becomes unclear: If the candidate transitions to the next tier, one could argue that the diff should be between the candidate revision and an empty object (since no previous revision exists in the staged tier). However, one could also argue that the diff should be between the candidate revision and the previous member revision. I think the most intuitive approach is to return a diff between the candidate revision and the previous member revision. This is because the candidate revision will eventually transition to the staged tier, and it is more intuitive to compare it against the most recent revision that exists in the next lifecycle stage (member) rather than an empty object.

To stick with the example, if a revision exists as a candidate, a previous revision exists as staged, and a previous revision exists as a member, the `GET /api/release-tracks/:id/candidates/:objectRef/diff` diff endpoint should return a diff between the candidate revision and the previous staged revision. This is because the candidate revision will eventually transition to the staged tier, and it is more intuitive to compare it against the most recent revision that exists in the next lifecycle stage (staged) rather than an empty object. Similarly, the `GET /api/release-tracks/:id/staged/:objectRef/diff` diff endpoint should return a diff between the staged revision and the previous member revision. This is because the staged revision will eventually transition to the member tier.

### Idea 2 - Diffing endpoint for all objects (not just release tracks)

Type-centric:
```
GET /api/:type/:id/diff
GET /api/:type/:id/modified/:modified/diff
```

Type-agnostic:

Embed the 
```
GET /api/attack-objects/:id/diff
GET /api/attack-objects/:id/modified/:modified/diff
{
    "compareTo": {
        "type": "attack-pattern",
        "id": "attack-pattern--1234",
        "modified": "2024-02-01T00:00:00.000Z",
    }
}
```

Set up a diffing endpoint that is type-agnostic and allows users to compare any two revisions of an object. The endpoint should accept a request body that specifies the `compareTo` revision, and the endpoint should return a diff between the current revision and the specified `compareTo` revision.
```
GET /api/compare
{
    "compareFrom": {
        "type": "attack-pattern",
        "id": "attack-pattern--1234",
        "modified": "2024-01-01T00:00:00.000Z",
    },
    "compareTo": {
        "type": "attack-pattern",
        "id": "attack-pattern--1234",
        "modified": "2024-02-01T00:00:00.000Z",
    }
}
```



## Repurposing the `note` object

- [ ] Implement support for tracking notes on snapshot objects (can be candidates, staged, or members). Notes should be stored in a separate Mongo collection and linked to the snapshot object via a reference field. Users should be able to add, edit, and delete notes via the API. Notably, we already have a notes service that can be leveraged for this purpose. However, it needs some modifications. The service was originally implemented with STIX in mind. The idea was to treat/represent notes as STIX objects and enable users to include them in emitted STIX bundles. However, the concept never really took off. We should modify the service to treat notes as second-class objects that are entirely separate from STIX, but rather as Workbench-native objects. Notes should be capable of being linked/attached to snapshot objects (candidates, staged, or members) as well as to objects independent of snapshots (documents in the `attackObjects` collection).

Make a new Mongo collection called `notes` to store notes. Each note should have the following fields:

```json
{
  "_id": "ObjectId",
  "content": "string",
  "created_by": "string",
  "last_modified_by": "string",
  "created_at": "Date",
  "modified_at": "Date",
  "snapshot_object_id": "ObjectId", // Reference to the snapshot object (if applicable)
  "object_id": "ObjectId" // Reference to the attack object (if applicable)
}
```

Notes will NOT be version controlled. If they are edited or deleted, the changes will be reflected immediately in the database, and recovery and undo functionality will not be supported.

Links/references between notes and snapshot objects will be one-to-many. A single snapshot object can have multiple notes attached to it, but a note can only be linked to one snapshot object at a time. Similarly, links/references between notes and attack objects will also be one-to-many. These should be bidirectionally tracked, meaning that if a note is linked to an attack object, the attack object should have a reference to the note in its metadata, and vice versa.

```json
// attackObjects collection
{
  "_id": "ObjectId",
  "workspace": {
      "notes": ["ObjectId"] // Array of references to notes linked to this attack object
  },
  "stix": "StixObject",
}
```