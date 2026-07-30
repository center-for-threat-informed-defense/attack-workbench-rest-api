# Release Track Backrefs on Objects

Every STIX object document carries reverse pointers to the release tracks that
currently reference it, in `workspace.release_tracks`. This lets you retrieve
an object through any standard getter (e.g. `GET /api/techniques/:stixId`,
`GET /api/attack-objects`) and see its release-track membership without
scanning tracks.

## Shape

```json
{
  "workspace": {
    "release_tracks": [
      {
        "id": "release-track--3a0e2537-1153-4b16-8ff5-1993f2d9cd7d",
        "type": "standard",
        "tier": "candidates",
        "status": "work-in-progress"
      }
    ]
  },
  "stix": { "...": "..." }
}
```

| Field | Values | Meaning |
|-------|--------|---------|
| `id` | `release-track--<uuid>` | The referencing release track |
| `type` | `standard`, `virtual` | The type of the referencing release track |
| `tier` | `members`, `staged`, `candidates`, `quarantine` | Which tier of the track references this revision; values match the snapshot tier array names |
| `status` | `modified-in-place`, `work-in-progress`, `awaiting-review`, `reviewed` | Track-scoped workflow status (`modified-in-place` is server-assigned when the pinned revision is edited via an in-place PUT) |

An object referenced by multiple tracks carries one entry per track.

## Semantics

- **Resolved to a revision.** Member and quarantine tiers pin an exact
  (`object_ref`, `object_modified`) revision. Candidate/staged tiers may
  instead store `"latest"`; their backref is attached to the exact revision
  that currently satisfies that selector. If a candidate selector is changed
  (`POST /:id/candidates/:objectRef/update-version`), reconciliation moves the
  backref accordingly. Different revisions of the same object can carry
  entries for the same track — e.g. after member sync auto-enrolls a dynamic
  candidate, the released revision keeps its `members` entry and the latest
  revision gets a `candidates` entry.
- **Follows new revisions under `track_latest`.** Creating a new revision of
  a tracked object keeps the backref on the object's latest revision: for
  `members`, the new revision is auto-enrolled with a dynamic candidate
  selector; an existing dynamic `candidates`/`staged` selector keeps its
  literal `"latest"` value while reconciliation moves its backref. An
  explicitly timestamp-pinned workflow entry remains fixed unless member-sync
  policy replaces it. Under the `manual` strategy, an exact pin stays where it
  is, while an explicitly chosen `"latest"` selector still follows the newest
  revision because that behavior is inherent in the selector; use
  `?versions=all` to see membership across revisions.
- **Reflects the latest snapshot.** Backrefs mirror the track's *current*
  (most recent) snapshot. Deleting the latest snapshot reverts backrefs to the
  previous snapshot's membership; deleting a track removes all of its entries.
  Entries written before the `type` field existed are backfilled
  automatically on the track's next contents change.
- **Status mapping.** Candidates and staged entries carry their track-scoped
  workflow status. Members are always `reviewed` (promotion to member implies
  review). Quarantined entries (virtual tracks) have no workflow status, so
  `status` is omitted.
- **Server-controlled.** Like `workspace.attack_id` and
  `workspace.validation`, the field is maintained by the server. Values
  supplied in `POST`/`PUT` bodies are silently ignored, and updates through
  the standard object endpoints cannot remove or alter existing entries.
- **Read-your-own-writes.** `POST`/`PUT` responses include backrefs produced
  by the request's own side effects — e.g. when revision sync re-pins a
  track to the newly created revision, the response body already carries the
  resulting `workspace.release_tracks` entry.

## In-place edits, deletes, and revocations

Release tracks are never blind to changes in the objects they pin:

- **Members-pinned revisions are immutable in place.** `PUT` and `DELETE`
  against a revision that any track pins in its `members` tier return
  `409 Conflict` — released content cannot be changed or destroyed under the
  track. Make changes by creating a new revision (`POST`); retire an object
  by creating a new revision with `x_mitre_deprecated: true`. Revision sync
  captures either one. This guard checks tagged snapshots authoritatively, not
  only the current `workspace.release_tracks` value. A revision remains
  protected when it belongs only to a historical tagged release, when a newer
  draft has removed it, or when a reconciliation failure temporarily omitted
  its backref.
- **Candidate/staged-pinned revisions can be edited in place, but the track
  sees it.** An in-place `PUT` (including one that only sets
  `x_mitre_deprecated`) marks the pinned entry `modified-in-place`: the
  content changed, but because in-place edits carry no revision history the
  track cannot say *what* changed — only that a re-review is required. The
  entry's tier is decided by the workflow gate against the track's candidacy
  threshold: in a strict track (threshold `reviewed`, the default) a staged
  entry demotes back to `candidates`; in a permissive track (threshold
  `work-in-progress` with `auto_promote`) the entry stays staged, since
  `modified-in-place` ranks with `work-in-progress`. `manual`-strategy
  tracks opt out entirely. Repeat edits of an entry already marked
  `modified-in-place` do not create additional snapshots. Reviewers clear
  the marker through the normal review endpoint
  (`from: "modified-in-place"`).
- **Revoking a tracked object queues the revoked revision.** The revoke
  workflow creates one new revision of the revoked object
  (`revoked: true`); revision sync enrolls it as a candidate in tracks where
  the object is a member and moves candidate/staged pins to it. The revoking
  object and the `revoked-by` relationship are not tracked explicitly —
  bundle export pulls secondary objects and their SROs in dynamically.

## Lifecycle example

```
POST /api/release-tracks/:id/candidates            → { tier: "candidates", status: "work-in-progress" }
POST /api/release-tracks/:id/candidates/review     → { tier: "candidates", status: "awaiting-review" }
POST /api/release-tracks/:id/candidates/promote    → { tier: "staged",     status: "awaiting-review" }
POST /api/release-tracks/:id/snapshots/latest/release                  → { tier: "members",    status: "reviewed" }
DELETE /api/release-tracks/:id                     → entry removed
```

## Reconciliation failures

Track mutations reconcile object backrefs before reporting success. If either
object collection cannot be updated, the API returns HTTP `500` with
`track_id` and `reconciliation_id`. The track mutation may already have been
persisted—including a release tag—so do not repeat it blindly. Give the
reconciliation ID to an administrator, who can inspect the durable failure
record and run the idempotent repair command.
