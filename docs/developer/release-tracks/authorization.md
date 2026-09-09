# Release-Track Authorization

Release-track access follows the existing Workbench roles. Read operations are
available to visitors and higher. Normal draft workflow operations require an
editor, team lead, or administrator. Deleting an entire track and all of its
history requires an administrator.

## Authorization matrix

| Capability                                                            | Visitor | Editor / team lead | Administrator |
| --------------------------------------------------------------------- | ------: | -----------------: | ------------: |
| List tracks, snapshots, candidates, and staged objects                |     Yes |                Yes |           Yes |
| Preview releases and export snapshots                                 |     Yes |                Yes |           Yes |
| Create tracks and drafts; manage candidates/staged/config/composition |      No |                Yes |           Yes |
| Tag a standard or virtual snapshot                                    |      No |                Yes |           Yes |
| Delete the latest untagged draft snapshot                             |      No |                Yes |           Yes |
| Convert the track's most recent release to draft                      |      No |                 No |           Yes |
| Change a tagged release's semantic version                            |      No |                 No |           Yes |
| Delete an entire track and all snapshot history                       |      No |                 No |           Yes |

Full-track deletion also requires `confirm_track_id` to equal the `:id` path
parameter. `POST /snapshots/:modified/draft` requires a JSON `confirm_version`
equal to the release version and an administrator (service-checked, `403`
otherwise). `DELETE /snapshots/:modified` is draft-only, editor-or-higher;
tagged snapshots always return `409`, including for administrators. Draft
deletion keeps latest/sole-snapshot, preserved-source, and dependency guards.

Release-version correction uses `PUT /snapshots/:modified/release`, is also
checked in the service, and does not require destructive confirmation because
it preserves the snapshot. It is serialized with release and rollback and is
recorded as `retag_release`.

Release conversion re-reads the snapshot and checks `confirm_version` under the
release lock. Both conversion and retag capture audit identity under that same
lock, so a competing version correction cannot invalidate confirmation or
change the version between audit capture and mutation.

## Audited destructive actions

The `delete_track`, `convert_release_to_draft`, and `retag_release` actions create a
`releaseTrackAuditEvents` record before the business operation begins.
The legacy `delete_release` value remains readable for historical audit events;
new requests never use it.

Each event records the authenticated actor, confirmation value, target track,
request summary, timestamps, and a `pending`, `completed`, or `failed` status.
An audit insert failure prevents the destructive operation. If the operation
persists but final audit-state recording fails, the API returns a structured
`500` containing the audit event ID instead of reporting unconditional
success.

See the [operator audit guide](../../admin/release-track-audit.md).
