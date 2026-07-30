# Release-Track Authorization

Release-track access follows the existing Workbench roles. Read operations are
available to visitors and higher. Normal draft workflow operations require an
editor, team lead, or administrator. Operations that can replace authoritative
membership or destroy history require an administrator.

## Authorization matrix

| Capability                                                            | Visitor | Editor / team lead | Administrator |
| --------------------------------------------------------------------- | ------: | -----------------: | ------------: |
| List tracks, snapshots, candidates, and staged objects                |     Yes |                Yes |           Yes |
| Preview releases and export snapshots                                 |     Yes |                Yes |           Yes |
| Create tracks and drafts; manage candidates/staged/config/composition |      No |                Yes |           Yes |
| Tag a standard or virtual snapshot                                    |      No |                Yes |           Yes |
| Delete an untagged individual snapshot                                |      No |                Yes |           Yes |
| Replace standard-track members directly                               |      No |                 No |           Yes |
| Delete an entire track and all snapshot history                       |      No |                 No |           Yes |

The two direct replacement routes and full-track deletion also require
`confirm_track_id` to equal the `:id` path parameter. Authorization runs before
the controller, and confirmation runs before request-body validation or
persistence.

## Audited destructive actions

The following actions create a `releaseTrackAuditEvents` record before their
business operation begins:

- `replace_members_latest`
- `replace_members_historical`
- `delete_track`

Each event records the authenticated actor, confirmation value, target track,
request summary, timestamps, and a `pending`, `completed`, or `failed` status.
An audit insert failure prevents the destructive operation. If the operation
persists but final audit-state recording fails, the API returns a structured
`500` containing the audit event ID instead of reporting unconditional
success.

See the [operator audit guide](../../admin/release-track-audit.md).
