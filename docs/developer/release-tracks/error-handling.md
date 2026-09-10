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

Convert the latest release with `POST /snapshots/:modified/draft` first, then
delete the returned draft if eligible; deleting an entire release track remains a separate
track-level operation.

### HistoricalSnapshotDeletionError

**Thrown when:** Attempting to delete an untagged draft that is no longer the
latest snapshot.

**HTTP Status:** 409 Conflict

The response identifies both `snapshot_modified` and
`latest_snapshot_modified`. Refresh the track and continue from the latest
draft. Standard tracks normally return 404 for a replaced draft because only
their newest untagged snapshot is retained; this exception remains relevant
to retained virtual drafts.

### SnapshotGraphPinnedRevisionError

**Thrown when:** A hard delete would remove an exact primary, relationship,
secondary, supporting, or LinkById dependency referenced by an opt-in
release-track snapshot graph. Full-lineage and collection
`deleteAllContents` operations are preflighted against the same invariant.

**HTTP Status:** 409 Conflict

The response includes `snapshot_graph_pins` entries identifying the track,
snapshot timestamp, manifest entry kind, and tier where applicable. Create a
new STIX revision instead. Administrator authorization is not a force-delete
override. STIX-changing PUTs are rejected globally by
`ImmutableStixRevisionError`; schema-v2 relationships have no exemption.

### NotFoundError

**Thrown when:** Collection with specified ID does not exist.

**HTTP Status:** 404 Not Found

**Example:**

```json
{
  "error": "Collection not found"
}
```
