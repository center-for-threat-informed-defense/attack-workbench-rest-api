# Release-Track Membership Reconciliation

Release-track snapshots are authoritative. Object documents carry
`workspace.release_tracks` as a derived current-snapshot index used for
navigation and mutation protection.

## Durable records

Every snapshot membership change creates a document in
`releaseTrackReconciliations` before the server updates object backrefs.

Important fields:

| Field | Meaning |
|---|---|
| `reconciliation_id` | Stable UUID returned to API callers when reconciliation fails |
| `track_id` | Track whose latest snapshot is being reconciled |
| `requested_snapshot_modified` | Snapshot current when the record was created; null means track deletion |
| `reconciled_snapshot_modified` | Snapshot actually used by the successful attempt |
| `source` | `contents_changed`, `repair`, or `full_scan` |
| `status` | `pending`, `completed`, or `failed` |
| `attempts` | Number of listener dispatch attempts |
| `last_error` | Most recent failure name and message |

API HTTP `500` responses containing a `reconciliation_id` mean the
release-track mutation may already be persisted. In particular, a release may
already be tagged. Inspect the track before repeating any mutation.

## Inspect failures

```javascript
db.releaseTrackReconciliations.find({
  status: { $in: ["pending", "failed"] }
}).sort({ updated_at: 1 }).pretty()
```

Inspect one response identifier:

```javascript
db.releaseTrackReconciliations.findOne({
  reconciliation_id: "<uuid-from-api-response>"
})
```

## Repair outstanding attempts

```bash
DATABASE_URL=mongodb://... npm run repair:release-track-backrefs
```

The default repairs up to 100 oldest pending/failed records. Set a bound:

```bash
DATABASE_URL=mongodb://... npm run repair:release-track-backrefs -- --limit=500
```

Each retry reads the track's current latest snapshot. It does not replay an
obsolete snapshot payload, so repeated repair is idempotent.

## Full scan

Run a full scan after an unclean shutdown or when legacy drift is suspected:

```bash
DATABASE_URL=mongodb://... npm run repair:release-track-backrefs -- --all
```

This unions registered track IDs with IDs found in object and relationship
backrefs. Existing tracks are reconciled to their current latest snapshots;
backrefs for tracks that no longer exist are removed.

The command prints JSON and exits nonzero if any track still fails. Preserve
failed records and command output for incident review.

## Known crash window

Snapshot persistence and reconciliation-record creation do not share a MongoDB
transaction. A hard crash between those writes can leave no pending record.
The full scan is the recovery mechanism for that narrow interval.
