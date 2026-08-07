# Release-Track Bundle Integrity Migration

The `20260805150000-repair-release-track-bundle-integrity` migration repairs
bundle metadata persisted by earlier deterministic release-track graph
implementations.

For every active or pending graph manifest that is still linked to a snapshot,
the migration creates or refreshes its frozen `x-mitre-collection` entry. The
entry uses one ID derived from the release-track UUID across the track's full
history, and its `created_by_ref` is the STIX ID returned by the configured
organization-identity service.

For tagged snapshots, the migration then recomputes `bundle_hashes.stix_2_0`
and `bundle_hashes.stix_2_1` from the exact four-space-indented download bytes.
STIX 2.0 serialization never includes the `x-mitre-collection` object; STIX
2.1 includes the repaired frozen object. Historical draft graphs are live
exports rather than deterministic caches, so any stale hashes on them are
removed.

The migration runs during normal startup when
`WB_REST_DATABASE_MIGRATION_ENABLE=true`. It is rerunnable: already-correct
collection entries and hashes are retained. Orphaned manifests that are no
longer linked from their recorded snapshot are reported and skipped.

The down migration is intentionally a no-op because restoring inconsistent
identifiers, creator references, or hashes would reintroduce invalid integrity
metadata.
