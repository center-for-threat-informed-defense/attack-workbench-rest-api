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
| `status` | `modified-in-place`, `work-in-progress`, `awaiting-review`, `reviewed` | Track-scoped workflow status (`modified-in-place` is retained for legacy data but is no longer produced because STIX revisions are immutable) |

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
- **Read-your-own-writes.** POST responses include backrefs produced when
  revision sync re-pins a track to the newly created revision. Metadata-only
  PUT responses retain the existing server-managed backrefs.

## In-place edits, deletes, and revocations

Release tracks are never blind to changes in the objects they pin:

- **Every persisted STIX revision is immutable.** A PUT whose `stix` payload
  differs from the stored revision returns `409 Conflict`, regardless of
  whether the revision is a member, candidate, staged object, or unrelated to
  a track. Create corrections and deprecations as new POST revisions. PUT is
  limited to non-exported `workspace` metadata and does not trigger revision
  sync.
- **Graph and membership pins protect deletion.** Exact revisions in tagged
  membership or an active/pending opt-in graph cannot be hard-deleted. The
  guard checks authoritative tagged snapshots and graph entries rather than
  relying only on `workspace.release_tracks`. A revision remains protected
  even if a derived backref is temporarily absent.
- **Revoking a tracked object queues the revoked revision.** The revoke
  workflow creates one new revision of the revoked object
  (`revoked: true`); revision sync enrolls it as a candidate in tracks where
  the object is a member and moves candidate/staged pins to it. The revoking
  object and the `revoked-by` relationship are not direct track members.
  Snapshot creation captures them as bounded secondary graph dependencies
  when applicable; later member-only bundle export replays its exact revision
  pointers. Unversioned marking definitions are the frozen-payload exception.

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
