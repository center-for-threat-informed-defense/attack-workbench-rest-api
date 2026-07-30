## Error Handling

### AlreadyReleasedError

**Thrown when:** Attempting to release a snapshot that already has `x_mitre_version` set.

**HTTP Status:** 409 Conflict

**Example:**

```json
{
  "error": "This snapshot has already been tagged as version 1.0"
}
```

**Solution:** Create a new draft through a supported release-track workflow
operation, then release the new snapshot.

### InvalidVersionError

**Thrown when:**

- Explicit version is not valid MAJOR.MINOR format
- Explicit version is not greater than the previous highest version
- Version release would result in regression

**HTTP Status:** 400 Bad Request

**Examples:**

```json
{
  "error": "Version must be greater than current version 1.5"
}
```

```json
{
  "error": "Invalid version format. Must match pattern: X.Y (e.g., 1.0, 2.3)"
}
```

**Solution:** Provide a valid version that is greater than all previous versions.

### TaggedSnapshotDeletionError

**Thrown when:** Attempting to delete a snapshot that has already been tagged.

**HTTP Status:** 409 Conflict

Tagged snapshots are immutable release records. Create or modify a draft
snapshot instead; deleting an entire release track remains a separate
track-level operation.

### HistoricalSnapshotDeletionError

**Thrown when:** Attempting to delete an untagged draft that is no longer the
latest snapshot.

**HTTP Status:** 409 Conflict

The response identifies both `snapshot_modified` and
`latest_snapshot_modified`. Refresh the track and continue from the latest
draft; historical drafts cannot be removed.

### SnapshotGraphPinnedRevisionError

**Thrown when:** An in-place update or hard delete would change an exact
primary, relationship, secondary, supporting, or LinkById dependency frozen
in a release-track snapshot graph. Full-lineage and collection
`deleteAllContents` operations are preflighted against the same invariant.

**HTTP Status:** 409 Conflict

The response includes `snapshot_graph_pins` entries identifying the track,
snapshot timestamp, manifest entry kind, and tier where applicable. Create a
new STIX revision instead. Administrator authorization is not a force-delete
override. Description-only relationship corrections remain allowed because
the older relationship payload is frozen inside each existing manifest;
source, target, and relationship-type changes return 400.

### NotFoundError

**Thrown when:** Collection with specified ID does not exist.

**HTTP Status:** 404 Not Found

**Example:**

```json
{
  "error": "Collection not found"
}
```
