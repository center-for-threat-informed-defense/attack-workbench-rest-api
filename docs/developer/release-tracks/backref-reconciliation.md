# Release Track Backref Reconciliation

How and why `workspace.release_tracks` (see the
[user doc](../../user/release-tracks/object-backrefs.md) for the field's
behavior) is kept in sync with release-track snapshots.

## Why

Before backrefs, release-track membership was only discoverable from the track
side: answering "which tracks reference this object?" required scanning every
track's latest snapshot for the object's `stix.id` across the `candidates`,
`staged`, `members`, and `quarantine` tiers. The predecessor system (Workbench
collections) solved the same problem with `workspace.collections` backrefs,
maintained imperatively by `AttackObjectsService.insertCollection`. Release
tracks follow that precedent but maintain the pointers event-driven.

## Why reconciliation instead of incremental updates

Membership changes through many routes: add/remove candidates, review,
manual and auto promotion, demotion, release (staged → members), member sync,
`updateContents`, track cloning, bundle import, snapshot deletion, and track
deletion. Patching each route with a bespoke incremental backref update would
be error-prone and would drift.

Instead, every route already funnels through a small set of persistence choke
points, and each choke point triggers a full **snapshot-driven reconciliation**:
compute the desired backref set from the track's latest snapshot, diff it
against the documents currently carrying an entry for that track, and issue
bulk add/update/remove operations. The reconciler is idempotent and
self-healing — a missed or failed pass is corrected by the next one.

## Event flow

```
snapshot-service.cloneSnapshot        ┐  (every tier/config/metadata mutation,
snapshot-service._cloneToNewTrack     │   member sync, auto-promotion,
snapshot-service.deleteSnapshot       │   bundle import, updateContents, ...)
snapshot-service.deleteTrack          │
versioning-service.releaseLatest/releaseByModified            ┘  (staged → members via tagSnapshotInPlace)
        │
        ▼  awaited EventBus.emit release-track::contents-changed  { trackId, snapshot }
        │                          snapshot = track's latest snapshot,
        │                          or null when the track (or its only
        │                          snapshot) was deleted
        │
        ├──► AttackObjectsService.handleReleaseTrackContentsChanged
        │      reconciles the attackObjects collection
        │      (refs where !object_ref.startsWith('relationship--'))
        │
        └──► RelationshipsService.handleReleaseTrackContentsChanged
               reconciles the relationships collection
               (refs where object_ref.startsWith('relationship--'))
```

Two listeners because relationships live in their own MongoDB collection;
per the event-bus ownership rules each service modifies only its own
documents. Both delegate to the shared logic in
`app/lib/release-tracks/backref-reconciler.js`, parameterized by repository
and an `includeRef` predicate.

`createTrack` does not emit — a brand-new track's tiers are empty and nothing
can reference its ID yet. `releaseByModified` may tag an older snapshot; the release
path therefore re-reads the *latest* snapshot before emitting rather than
using the tagged one.

Emissions are awaited (the request/response-blocking convention), so backrefs
are consistent by the time the triggering API call returns.

## Reconciliation algorithm

For one `(repository, trackId, snapshot, includeRef)`:

1. **Desired set** — resolve candidate/staged `"latest"` selectors for the
   current reconciliation pass, then walk the snapshot tiers in order
   `members`, `staged`, `candidates`, `quarantine`, keyed by the resulting
   exact `(object_ref, object_modified)` pair. The persisted workflow selector
   remains unchanged. First-tier-wins remains a defensive fallback for
   legacy/directly written invalid documents. Status mapping:
   members → `reviewed`; staged/candidates → the entry's `object_status`;
   quarantine → none.
2. **Current set** — `find({ 'workspace.release_tracks.id': trackId })`,
   supported by a sparse multikey index on both collections.
3. **Diff → bulkWrite** (batched, unordered):
   - current but not desired → `$pull` the track's entry;
   - both, but tier/status/type differ → positional `$set`/`$unset` (the
     `type` comparison also backfills entries written before the field
     existed);
   - desired but not current → resolve the pinned revision to its `_id`
     (batched `$or` on the `stix.id + stix.modified` index) and `$push` the
     entry. Pins whose revision document doesn't exist (dangling pin, or a
     ref belonging to the other collection) are skipped.

Repository support lives in `BaseRepository`
(`retrieveReleaseTrackRefsLean`, `retrieveVersionRefsLean`, `bulkWrite`), so
both `attackObjectsRepository` and `relationshipsRepository` inherit it.

## Server-controlled invariants

`workspace.release_tracks` is stripped from client input in
`BaseService.stripServerControlledFields` (create/update) and
`composeForImport` (import), alongside `workspace.validation`. Because
backrefs are pinned to specific revisions, code paths that clone a document
into a *new* revision must not carry the field forward; this is handled in:

- `BaseService.revoke` (revoked revision clone),
- `AttackObjectsService.handleOrganizationIdentityChanged` (identity
  propagation clones),
- `RelationshipsService.handleObjectRevoked` and
  `handleSubtechniqueConvertedToTechnique` (relationship deprecation clones),
- `TechniquesService.convertToSubtechnique` / `convertToTechnique`
  (conversion clones).

(Clones routed through `create()` — e.g. the relationship *transfer* during
revoke — are already covered by `stripServerControlledFields`.)

Relatedly, revision identity is immutable in place: `BaseService.updateFull`
rejects (400) a PUT whose body `stix.id`/`stix.modified` differ from the path
parameters, so a pinned revision can never be re-keyed out from under a
track's pin (which would strand the pin and orphan the backref).

New revisions created through `create()` are covered by the strip; if any
track references the object (members, candidates, or staged), member sync
enrolls a dynamic workflow selector or refreshes an existing one. A snapshot
clone or an explicit contents-changed reconciliation then moves that dynamic
backref to the newly latest revision without rewriting the stored selector
(see `member-sync-strategies.md`).

## Known limitations

- **Deleted-then-recreated revisions.** If an object revision document is
  deleted while pinned by a track, the backref disappears with the document
  and the track keeps a dangling pin (pre-existing behavior). If an identical
  revision is later re-created, its backref is restored on the next
  contents-changed event for that track, not immediately.
- **Historical snapshots.** Backrefs describe only the *latest* snapshot per
  track. Membership in older snapshots remains discoverable only from the
  track side.
