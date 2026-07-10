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
| `tier` | `members`, `staged`, `candidates`, `quarantine` | Which tier of the track references this revision; values match the snapshot tier array names |
| `status` | `work-in-progress`, `awaiting-review`, `reviewed` | Track-scoped workflow status |

An object referenced by multiple tracks carries one entry per track.

## Semantics

- **Revision-pinned.** Release-track tiers pin specific object revisions
  (`object_ref` + `object_modified`). The backref lives on exactly the pinned
  revision document. If a track's candidate pin is moved to a newer revision
  (`POST /:id/candidates/:objectRef/update-version`), the backref moves with
  it. Different revisions of the same object can carry entries for the same
  track — e.g. after member sync auto-enrolls a new revision as a candidate,
  the released revision keeps its `members` entry and the new revision gets a
  `candidates` entry.
- **Follows new revisions under `track_latest`.** Creating a new revision of
  a tracked object keeps the backref on the object's latest revision: for
  `members`, the new revision is auto-enrolled as a candidate; for
  `candidates`/`staged` pins, the pin (and its backref) moves to the new
  revision per the track's member-sync supplant config. Under the `manual`
  strategy, pins stay where they are — the old pinned revision keeps the
  backref, and the new revision (which the track genuinely does not
  reference) has none; use `?versions=all` to see membership across
  revisions.
- **Reflects the latest snapshot.** Backrefs mirror the track's *current*
  (most recent) snapshot. Deleting the latest snapshot reverts backrefs to the
  previous snapshot's membership; deleting a track removes all of its entries.
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

## Lifecycle example

```
POST /api/release-tracks/:id/candidates            → { tier: "candidates", status: "work-in-progress" }
POST /api/release-tracks/:id/candidates/review     → { tier: "candidates", status: "awaiting-review" }
POST /api/release-tracks/:id/candidates/promote    → { tier: "staged",     status: "awaiting-review" }
POST /api/release-tracks/:id/bump                  → { tier: "members",    status: "reviewed" }
DELETE /api/release-tracks/:id                     → entry removed
```
