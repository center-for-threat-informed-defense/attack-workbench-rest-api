# Release-Track Deterministic Graph Migration

Release-track snapshot bundles depend on exact relationship endpoints and a
frozen snapshot graph manifest. The
`20260730180000-backfill-deterministic-snapshot-graphs` migration establishes
that data for an existing Workbench database.

## Before deployment

Run the read-only preview against the target database:

```bash
DATABASE_URL='mongodb://host/database' \
  npm run preview:deterministic-snapshot-graphs
```

The report includes the latest active relationship revisions scanned, endpoint
pins that would be written, release-track snapshots found, and baseline
manifests that would be created. No database writes or indexes are created by
this command.

The preview fails if an active latest relationship references a source or
target object that no longer exists. The error identifies the affected
relationship and missing endpoint IDs; repair those dangling endpoints before
deployment. Deprecated and revoked relationships are not eligible for bundle
graphs, so the migration leaves that inactive legacy history untouched.
Snapshot graph capture fails closed rather than silently producing an
incomplete deterministic baseline.

## What the migration writes

- Exact source and target revision metadata is added only to active latest
  relationship revisions in the underlying `relationships` collection.
  `view.relationships.latest.active` may be used for discovery but is never
  written.
- Each existing release-track snapshot receives a graph manifest containing
  its exact primary, relationship, secondary, supporting, and LinkById
  dependencies.
- Backfilled manifests are marked `baseline_reconstruction: true`. They
  reproduce the graph visible at migration time; the server cannot infer the
  historically exact graph of snapshots created before endpoint pins existed.

The migration is rerunnable. A complete manifest already linked to a snapshot
is reused, and a linked pending manifest left by an interrupted activation is
activated instead of duplicated.

## Deployment behavior

With `WB_REST_DATABASE_MIGRATION_ENABLE=true`, the migration runs during
normal server startup. If migrations are managed separately, run the standard
`migrate-mongo` workflow after reviewing the preview and before accepting
release-track traffic.

After deployment, smoke-test one standard and one virtual snapshot with
`format=bundle`. Editing or hard-deleting a frozen secondary revision should
return `409 Conflict`; creating a new revision remains the supported update
path.
