## Output Formats

Release tracks (or rather, each snapshot) can serialize/export to multiple formats via query parameter:

```
GET /api/release-tracks/:id/snapshots/latest?format=<format>
```

### Format: `workbench` (Default)

Workbench-optimized release-track snapshot format. This is the default response
shape for snapshot retrieval endpoints and is intended for the Workbench frontend.

```json
{
  "id": "release-track--123",
  "type": "standard",
  "version": null,
  "name": "ATT&CK Enterprise",
  "modified": "2024-01-15T16:20:00Z",
  "members": [
    {
      "object_ref": "attack-pattern--aaa",
      "object_modified": "2024-01-10T10:00:00Z",
      "attack_id": "T1234",
      "name": "Technique A",
      "description": "Technique description",
      "modified_by_user": {
        "id": "identity--...",
        "username": "alice",
        "displayName": "Alice Example",
        "name": "Alice Example"
      }
    }
  ],
  "staged": [],
  "candidates": [],
  "quarantine": []
}
```

**Characteristics:**

- Preserves the release-track snapshot structure
- Includes `members`, `staged`, `candidates`, and `quarantine` tier arrays when present
- Member and quarantine `object_modified` values are exact timestamps.
  Standard candidate and staged entries may instead contain `"latest"`; the
  response enriches them from the currently latest object revision without
  replacing the stored selector.
- Adds UI-friendly object details to tier entries
- Fails with HTTP `409` and `missing_references` rather than returning
  partially enriched tier content when a selected primary revision is missing
- Suitable for Workbench UI rendering and release-track management workflows

Use `include` to narrow tier arrays in `workbench` responses:

```bash
GET /api/release-tracks/:id/snapshots/latest?include=members
GET /api/release-tracks/:id/snapshots/latest?include=staged
GET /api/release-tracks/:id/snapshots/latest?include=candidates
GET /api/release-tracks/:id/snapshots/latest?include=quarantine
GET /api/release-tracks/:id/snapshots/latest?include=all
```

### Format: `bundle`

Standard STIX bundle format:

```json
{
  "type": "bundle",
  "id": "bundle--...",
  "objects": [
    {
      "type": "x-mitre-collection",
      "id": "x-mitre-collection--123",
      "name": "ATT&CK Enterprise",
      "description": "Q1 publication snapshot",
      "x_mitre_version": "1.1",
      "x_mitre_contents": [
        { "object_ref": "attack-pattern--aaa", "object_modified": "2024-01-10T10:00:00.000Z" }
      ],
      "object_marking_refs": ["marking-definition--..."]
    },
    {
      "type": "attack-pattern",
      "id": "attack-pattern--aaa",
      "name": "Technique A"
      // ... STIX properties only, no workflow info
    }
  ]
}
```

**Characteristics:**

- STIX compliant (2.1 by default; 2.0 via `stixVersion=2.0`). Per the STIX
  specifications, the bundle object carries `spec_version` only for STIX 2.0;
  STIX 2.1 bundles omit it and each object declares its own `spec_version`.
- Only includes `stix.*` properties
- No workflow states, no workspace data
- Self-contained: identities and marking definitions referenced by the
  exported objects are included automatically
- `LinkById` tags in descriptions are converted to markdown citations
- Drafts, graphless tagged snapshots, and every export that includes candidate
  or staged tiers resolve the bounded graph live. A tagged member-only export
  is deterministic only after its snapshot opts into a graph manifest. That
  manifest is closed over exact members: relationships are included only when
  both exact endpoint revisions are members, and do not add secondary SDOs.
- Frontends may describe manifest creation as **caching the bundle**. The
  cache pins the exact member graph for repeatable export; it is not a general
  performance cache, and candidate or staged additions remain live.
- Bundle export is fail-closed for primary content. If any selected exact
  revision no longer exists, the server returns HTTP `409` with every missing
  `(object_ref, object_modified)` pair in `missing_references`; it never emits
  a partial bundle. A repository/database failure is returned as a server
  error rather than being mistaken for missing content.
- Workbench note objects are never included. The snapshot's own
  `snapshot_description` is publication metadata and becomes the TOC
  `description`.
- Suitable for external publication

**Bundle query parameters** (apply only when `format=bundle`):

| Parameter     | Values                                                              | Default          | Description                                                                                                                                                                            |
| ------------- | ------------------------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `include`     | `staged`, `candidates` (comma-separated or repeated)                | _(members only)_ | Additional tiers to include in the bundle alongside members                                                                                                                            |
| `state`       | `work-in-progress`, `awaiting-review` (comma-separated or repeated) | _(no filter)_    | Narrows the staged/candidate entries selected via `include` by workflow status. Entries marked `reviewed` are always included, irrespective of this parameter. Members are unaffected. |
| `stixVersion` | `2.0`, `2.1`                                                        | `2.1`            | STIX version the emitted bundle conforms to                                                                                                                                            |
| `includeToc`  | `true`, `false`                                                     | `true`           | Include a table-of-contents object (of type `x-mitre-collection`) as the first object in the bundle                                                                                    |

Examples:

```bash
# Members only (default)
GET /api/release-tracks/:id/snapshots/latest?format=bundle

# Members + staged objects
GET /api/release-tracks/:id/snapshots/latest?format=bundle&include=staged

# Members + candidates and staged objects that are work-in-progress or reviewed
GET /api/release-tracks/:id/snapshots/latest?format=bundle&include=candidates,staged&state=work-in-progress

# STIX 2.0 bundle without a table of contents
GET /api/release-tracks/:id/snapshots/latest?format=bundle&stixVersion=2.0&includeToc=false
```

**The table of contents (TOC) object**

By default, bundles begin with an `x-mitre-collection` object that acts as a
table of contents. It is derived from the release-track metadata:

- `id` — stable per track (reuses the track UUID)
- `name` — from the release track snapshot
- `description` — from the snapshot's `snapshot_description`; falls back to
  the long-lived track `description` when no snapshot-local value is set
- `x_mitre_version` — the snapshot's tagged version, or `0.1` for draft snapshots
- `modified` — the snapshot's modified timestamp
- `x_mitre_attack_spec_version` — the deployment's default ATT&CK spec version
- `x_mitre_contents` — every object in the bundle (marking definitions are
  recorded in `object_marking_refs` instead)

### Format: `filesystemstore` (Not Implemented)

STIX FileSystemStore export is planned, but is not implemented yet. Requests
with `format=filesystemstore` currently return HTTP 501.

STIX FileSystemStore structure (directory tree):

```
collection-123/
  x-mitre-collection/
    x-mitre-collection--123.json
  attack-pattern/
    attack-pattern--aaa.json
    attack-pattern--bbb.json
  malware/
    malware--xxx.json
```

**Example Response:**

```json
{
  "format": "filesystemstore",
  "structure": {
    "x-mitre-collection": [
      {
        "filename": "x-mitre-collection--123.json",
        "content": {
          /* STIX object */
        }
      }
    ],
    "attack-pattern": [
      {
        "filename": "attack-pattern--aaa.json",
        "content": {
          /* STIX object */
        }
      }
    ]
  }
}
```

> **NOTE**: The `filesystemstore` is still a _concept_ that will need additional refinement before it can be implemented. We will need to figure out an optimal way to return JSON files to the user. Optionally, we can attempt to generate an archive and serialize it over the wire, though this may be slow and error prone. Additionally, we can allow users to specify an output path via S3, FTP, etc.

### Format Usage

```bash
# Workbench UI response
GET /api/release-tracks/:id/snapshots/latest
GET /api/release-tracks/:id/snapshots/latest?format=workbench

# Standard STIX bundle for publication
GET /api/release-tracks/:id/snapshots/latest?format=bundle

# FileSystemStore export is not implemented yet
GET /api/release-tracks/:id/snapshots/latest?format=filesystemstore  # Returns HTTP 501

# release preview with detailed preview
GET /api/release-tracks/:id/snapshots/latest/release/preview?format=workbench
```
