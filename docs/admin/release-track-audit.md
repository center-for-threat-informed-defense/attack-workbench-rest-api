# Release-Track Destructive Audit Events

Workbench stores administrator-initiated destructive attempts in
`releaseTrackAuditEvents`: full-track deletion (`delete_track`), rollback of a
track's most recent release (`delete_release`), and release-version correction
(`retag_release`). The collection is empty until an administrator performs one
of those actions.

Each record contains:

- `event_id`, `action`, and `track_id`
- the authenticated `actor`
- the exact destructive `confirmation` supplied by the caller (or the prior
  version for `retag_release`)
- a bounded request/result summary
- `pending`, `completed`, or `failed` status
- start/finish timestamps and failure detail

Inspect recent events:

```javascript
db.releaseTrackAuditEvents.find().sort({ started_at: -1 }).limit(50).pretty();
```

Inspect destructive actions for one track:

```javascript
db.releaseTrackAuditEvents
  .find({
    track_id: 'release-track--...',
  })
  .sort({ started_at: -1 })
  .pretty();
```

Inspect incomplete or failed attempts:

```javascript
db.releaseTrackAuditEvents
  .find({
    status: { $in: ['pending', 'failed'] },
  })
  .sort({ started_at: 1 })
  .pretty();
```

A `pending` event can mean the process stopped after the audit insert or the
track was deleted but the final audit update failed. Confirm whether the track
still exists before retrying.

These records have no automatic TTL. Establish retention and archive policy
according to local audit requirements.
