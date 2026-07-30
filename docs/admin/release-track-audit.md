# Release-Track Destructive Audit Events

Workbench stores administrator-initiated member replacement and full-track
deletion attempts in `releaseTrackAuditEvents`.

Each record contains:

- `event_id`, `action`, and `track_id`
- the authenticated `actor`
- the exact `confirmation` supplied by the caller
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
operation completed but the final audit update failed. Inspect the target
track before retrying. A failed member replacement may also have persisted a
new snapshot if backref reconciliation subsequently failed; correlate its
timestamp with `releaseTrackReconciliations`.

These records have no automatic TTL. Establish retention and archive policy
according to local audit requirements.
