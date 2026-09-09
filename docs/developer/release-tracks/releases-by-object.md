# Releases By Object: Design and Implementation

## Problem

`workspace.release_tracks` is a current-membership index. It mirrors the
latest snapshot of each track and therefore cannot answer which historical,
tagged releases contained a STIX object. Looking only at current backrefs
would miss a tagged release after a later snapshot removed the object.

Release-track snapshots are also physically isolated: every track owns a
dynamic MongoDB collection. A correct global lookup must either fan out across
those collections or maintain an object-to-release inverted index. The first
implementation preserves the existing storage boundary and uses a bounded,
registry-driven fan-out.

## Registry release catalogue

`releaseTrackRegistry` remains the global indexing point and continues to
contain exactly one document per track. Each document carries a compact list
of tagged-release references:

```javascript
{
  track_id: 'release-track--...',
  type: 'standard',
  name: 'Enterprise ATT&CK',
  tagged_releases: [
    {
      snapshot_modified: new Date('2026-07-13T15:52:58.508Z'),
      version: '1.0',
      tagged_at: new Date('2026-07-13T16:00:00.000Z'),
      tagged_by: 'user-id'
    }
  ],
  tagged_release_count: 1,
  latest_tagged_version: '1.0'
}
```

There is no separate `snapshot_id`: a snapshot is identified by its track ID
and `modified` timestamp. `tagged_release_count` is derived from the array
length. The dynamic snapshot remains authoritative for its contents.

### Reconciliation

Tagging is already a two-document workflow: it inserts or updates the release
in its dynamic collection, then updates the registry. After a successful tag, the
service reads the track's tagged snapshot metadata and replaces the registry
projection. Reconciliation rather than `$push` makes the operation idempotent
and repairs missing entries.

Existing deployments receive the same projection through an idempotent
database migration. Tagged snapshot content is immutable. The newest standard
release can be rolled back only when its preserved source draft exists and no
virtual snapshot resolved it. Draft squashing excludes preserved sources.

Version calculation and monotonicity validation use track-wide tagged release
metadata rather than a draft's copied ledger.

## Query algorithm

For `GET /api/release-tracks/objects/:objectRef/releases`:

1. Read registry documents that have tagged releases, applying an optional
   standard/virtual type filter.
2. For every eligible track, query its dynamic collection once with the full
   set of referenced tagged snapshot timestamps and the requested
   `members.object_ref`.
3. Project only snapshot metadata and the matching member entry.
4. Execute track queries through a small bounded-concurrency runner.
5. Flatten the matches, join tagging attribution from the registry, sort by
   `snapshot_modified` with stable tie-breakers, then apply pagination.

This is one database query per eligible track, not per tagged release. The
cost is still proportional to the number of tagged tracks and does not shrink
with response pagination because membership is unknown until each track is
searched. If measured production latency later makes that unacceptable, an
object-to-release inverted index is the appropriate follow-on; it is not part
of this design.

## Per-track index

Each dynamic collection receives a partial multikey index equivalent to:

```javascript
{
  key: { 'members.object_ref': 1, modified: -1 },
  partialFilterExpression: { version: { $type: 'string' } }
}
```

Only tagged snapshots contribute index keys. This avoids amplifying the large
volume of intermediate drafts and makes the index naturally compatible with
draft squashing.

## Response semantics

- A match is a direct `members` entry in a tagged snapshot.
- The query is by STIX ID and spans all revisions; every row reports the exact
  pinned `object_modified` revision.
- Candidates, staged entries, quarantine entries, and secondary objects added
  only during bundle export are excluded.
- Standard and virtual tracks are included unless filtered.
- Ascending snapshot order exposes first tagged appearance. It is not an audit
  record of when the object first entered a draft.
- A valid but unmatched STIX ID returns an empty 200 response.
