# Release Track Versioning and Release Process

## Overview

The Release Tracks API uses a Git-inspired versioning strategy that separates two distinct concerns:

1. **Draft State** - Standard tracks keep one rolling, untagged snapshot
2. **Release History** - Tagged snapshots are retained as immutable releases using semantic versioning

This approach allows continuous development while providing stable, versioned releases for publication.

**Note on Terminology:** We use **release track** instead of "collection" to avoid confusion with TAXII collections, MongoDB collections, STIX bundles, and `x-mitre-collection` SDOs. See [terminology.md](terminology.md) for the complete terminology guide.

## Core Concepts

### Snapshots

A **snapshot** is an immutable state of a release track at a specific point in time, identified by:

- `id` - The release track's STIX identifier (constant across all snapshots)
- `modified` - ISO 8601 timestamp when the snapshot was created (unique per snapshot)

Every content-changing operation creates a replacement snapshot with a new
`modified` timestamp. For a standard track, the replacement is saved first and
then the older untagged draft is removed. Tagged snapshots are never pruned.

A snapshot may be either a **draft release** (untagged) or a **tagged release** (has version number).

### Draft Releases vs Tagged Releases

A **draft release** is a snapshot without a version number (`version === null`). It represents work-in-progress.

A **tagged release** is a snapshot that has been marked as production-ready for publication, identified by:

- `version` - Version string in MAJOR.MINOR format (e.g., "1.0")

**Note:** ATT&CK release tracks use a two-part versioning scheme (MAJOR.MINOR), not the three-part semver format (MAJOR.MINOR.PATCH). The patch component is not tracked in `version`.

Not all snapshots are tagged releases. Only snapshots explicitly tagged via the **release** operation become tagged releases.

**Example Timeline with Tagged Releases (standard track):**

```
id: "release-track--123", modified: "2024-01-01T10:00:00.000Z"
  version: null  ← FIRST ROLLING DRAFT

id: "release-track--123", modified: "2024-01-02T14:30:00.000Z"
  version: null  ← REPLACEMENT DRAFT; THE 2024-01-01 DRAFT IS PRUNED

id: "release-track--123", modified: "2024-01-05T09:15:00.000Z"
  version: "1.0"  ← TAGGED RELEASE (via release operation)
  version_history: [{
    version: "1.0",
    tagged_at: "2024-01-05T10:00:00Z",
    tagged_by: "user@example.com",
    modified: "2024-01-05T09:15:00.000Z"
  }]

id: "release-track--123", modified: "2024-01-10T11:00:00.000Z"
  version: null  ← NEW ROLLING DRAFT AFTER RELEASE 1.0

id: "release-track--123", modified: "2024-01-15T16:20:00.000Z"
  version: "1.1"  ← TAGGED RELEASE (via release operation)
  version_history: [
    { version: "1.1", tagged_at: "2024-01-15T17:00:00Z", tagged_by: "user@example.com", modified: "2024-01-15T16:20:00.000Z" },
    { version: "1.0", tagged_at: "2024-01-05T10:00:00Z", tagged_by: "user@example.com", modified: "2024-01-05T09:15:00.000Z" }
  ]
```

The timeline lists the first draft only to illustrate its replacement. Once the
second draft is durably stored, the first draft is no longer retrievable.

## The Release Operation

### What Does Releasing Do?

The `release` operation **tags an existing snapshot as a release** by assigning
it a semantic version number (without the patch number). It does **not** create
a new snapshot. `release` is the command; `tagged` describes the resulting
snapshot state.

This is analogous to Git's tagging system:

- Git commits = release track snapshots (identified by `modified` key)
- Git tags = tagged releases (identified by `version` key)

For a standard track, release planning also freezes workflow selectors.
Candidate entries are not released. Staged entries with an explicit timestamp
retain that exact revision; staged entries whose `object_modified` value is
`"latest"` are resolved to the actual latest `stix.modified` timestamp when
the preview or commit request is handled. Only exact revisions are promoted
into `members`, so the tagged release never contains a dynamic member
reference.

Releasing does not automatically create a graph manifest. A tagged snapshot
may subsequently opt into deterministic member-graph retrieval with:

```http
POST /api/release-tracks/:id/snapshots/:modified/graph
```

Deleting that manifest with the corresponding `DELETE` operation returns the
snapshot to live graph resolution. Candidate and staged export additions are
always resolved live; the determinism guarantee applies only to `members`.

### In-Place Tagging Strategy

When you release a snapshot:

1. The **existing** snapshot is updated in-place
2. `version` is set to the new version
3. An entry is added to `version_history` for audit trail
4. The `modified` timestamp **does not change**

**Why in-place?**

- Avoids duplicate data (no need to copy the entire release track)
- Clear semantics: tagging is metadata, not a content change
- Snapshots remain immutable except for the version tag
- Matches Git's model where tags point to existing commits

### Tagging Endpoints

#### Release Latest Snapshot

```
POST /api/release-tracks/:id/snapshots/latest/release
```

Releases the most recent snapshot (highest `modified`) as a tagged release.

**Request Body:**

```json
{
  "increment": "major"
}
```

Use `"version": "2.0"` instead of `increment` for an explicit version.
The selectors are mutually exclusive: supplying both returns `400 Bad
Request`, and the server never chooses one over the other. Omitting both
version selectors defaults to a minor increment. The `latest` path segment
selects whichever snapshot is latest when the release request is handled.
Callers that need to pin the operation to one snapshot should use the
`:modified` endpoint.

**Examples:**

1. **Automatic version calculation:**

```bash
# Current latest tagged release: 1.2
# Tag as: 1.3 (minor increment)
POST /api/release-tracks/release--123/snapshots/latest/release
{
  "increment": "minor"
}
```

1. **Major version increment:**

```bash
# Current latest tagged release: 1.2
# Tag as: 2.0 (major increment)
POST /api/release-tracks/release--123/snapshots/latest/release
{
  "increment": "major"
}
```

1. **Explicit version:**

```bash
# Set a specific version within the selected snapshot's chronological bounds
POST /api/release-tracks/release--123/snapshots/latest/release
{
  "version": "2.0"
}
```

1. **Default version selection:**

```bash
# Defaults to minor increment
POST /api/release-tracks/release--123/snapshots/latest/release
{}
```

#### Release Specific Snapshot

```
POST /api/release-tracks/:id/snapshots/:modified/release
```

Tags a specific snapshot as a tagged release. Can tag retroactively, (i.e., a non-latest snapshot can be tagged), granted no [versioning rules](#versioning-rules) are violated.

**Use Cases:**

- You want to tag snapshot 3, then later also tag snapshot 5
- You forgot to tag a snapshot and want to mark it retroactively
- You want to create multiple tagged releases from different development branches

**Constraint:** The version must be greater than the nearest earlier tagged
snapshot and less than the nearest later tagged snapshot. Both bounds are
exclusive. This allows a forgotten historical draft to be tagged without
breaking the version order of the timeline.

## Versioning Rules

### Version Format

Collections use a **two-part versioning scheme** (MAJOR.MINOR), inspired by semantic versioning but simplified for ATT&CK's release model:

- **MAJOR** (`X.0`) - Significant releases with substantial changes, may include breaking changes
- **MINOR** (`X.Y`) - Incremental releases with additions, updates, or fixes

**Note:** Unlike full semantic versioning (MAJOR.MINOR.PATCH), ATT&CK collections do not track patch versions. All changes, including bug fixes, increment the minor version or major version depending on significance.

### Version Constraints

1. **Chronologically increasing** - Tagged versions increase with snapshot
   `modified` time. A retroactive tag is exclusively lower- and upper-bounded
   by its adjacent tagged snapshots.
2. **Immutable once set** - Once a snapshot has `version` assigned, it cannot be changed
3. **Cannot re-tag** - A snapshot can only be tagged once (throws `AlreadyReleasedError` if attempted)
4. **Valid version format** - Must match `/^\d+\.\d+$/` (MAJOR.MINOR only, no patch component)
5. **Unique within the track** - Exactly one snapshot may hold a given tagged
   version. If concurrent release requests race for the same version, one
   succeeds and the other receives `409 Conflict` with the conflicting
   `track_id` and `version`.

Relative `minor` and `major` increments are calculated from the nearest
earlier tagged snapshot, not from the numerically highest tag elsewhere in the
track. For example, a draft after explicit v19.1 previews as v19.2 for `minor`
and v20.0 for `major`. A historical draft between v1.0 and v3.0 previews as
v1.1 or v2.0 and may use any explicit version strictly inside that interval.

### First Tagged Release

For release tracks with no prior tagged releases:

- The first tag sets `version: "1.0"` (regardless of increment type)
- Or you can specify an explicit version like `"0.1"`
