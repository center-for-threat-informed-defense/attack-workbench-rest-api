# Virtual Release-Track Schedules

Virtual release tracks can materialize draft snapshots explicitly or through
their persisted `snapshot_schedule`. Scheduled execution uses the same
composition-resolution and snapshot-persistence services as the explicit
virtual snapshot creation endpoint.

## Activation and timing

`ENABLE_SCHEDULER=true` activates all Workbench scheduler tasks, including
virtual-track materialization. `VIRTUAL_TRACK_SCHEDULES_CRON` controls how
often the server reconciles persisted schedules; it defaults to once per
minute.

All five-field cron expressions and explicit dates are interpreted in UTC.
Cron jobs fire only while a scheduler instance is running. They do not
backfill occurrences missed during downtime. Date schedules are durable:
every configured timestamp at or before reconciliation is registered and
processed after startup.

`manual` schedules register no executable work. Operators must call
`POST /api/release-tracks/:id/virtual/snapshots/create`.

## Idempotency and multiple instances

The `virtualTrackScheduleOccurrences` collection stores one durable occurrence
per track and UTC timestamp. Workers atomically claim pending or retryable
occurrences. The resulting snapshot also records
`scheduled_materialization.scheduled_for` under a unique track-local index.
Together, these controls prevent duplicate drafts across restarts, retry
delivery, and multiple scheduler-enabled API instances.

## Failures and retries

An occurrence commonly fails when a component resolution has no matching
tagged snapshot. The occurrence remains `failed` and becomes retryable after
one minute. The reconciliation task retries it automatically; no schedule
resubmission is required. Permanent configuration errors continue to retry
until an operator corrects the component release state or removes the track.

Every attempt creates an `automationRuns` record with:

- `automation_type: "scheduler"`
- `name: "virtual-track-snapshot-materialization"`
- `scope.track_id` and `scope.schedule_mode`
- `trigger.scheduled_for`
- terminal counts and an item-level error or created snapshot timestamp

See [Automation Run Audit Trail](automation-runs.md) for queries and
operational inspection patterns.
