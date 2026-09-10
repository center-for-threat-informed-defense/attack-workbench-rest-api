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
- Every export replays the snapshot's sealed content manifest: exact member
  revisions, relationships whose source and target are both members (pinned
  to those member revisions), supporting objects, and LinkById targets. No
  secondary SDO is discovered through a relationship, and no workflow tier is
  ever added: a draft bundle is exactly the manifest it inherited. To see what
  a release would ship, use the release preview (`.../release/preview?format=bundle`),
  which resolves the planned members live.
- Released snapshots carry a stable `bundle_id` and SHA-256 `bundle_hashes`
  for both serializations; repeated downloads are byte-for-byte identical.
  Draft bundles use a deterministic identifier derived from the snapshot.
- Bundle export is fail-closed for primary content. If any selected exact
  revision no longer exists, the server returns HTTP `409` with every missing
  `(object_ref, object_modified)` pair in `missing_references`; it never emits
  a partial bundle. A repository/database failure is returned as a server
  error rather than being mistaken for missing content.
- Workbench note objects are never included. The snapshot's own
  `snapshot_description` is publication metadata and becomes the collection
  object's `description`.
- Suitable for external publication

**Bundle query parameters** (apply only when `format=bundle`):

| Parameter     | Values       | Default | Description                                                                                                                                         |
| ------------- | ------------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stixVersion` | `2.0`, `2.1` | `2.1`   | STIX version the emitted bundle conforms to. STIX 2.1 bundles always begin with the `x-mitre-collection` object; STIX 2.0 bundles never include it. |

`include` is a `workbench` tier selector. Sending it with `format=bundle`
returns `400`: a bundle always replays the sealed content manifest, so a
request for staged or candidate objects is refused rather than silently
answered with members only.

Examples:

```bash
# Sealed content (STIX 2.1)
GET /api/release-tracks/:id/snapshots/latest?format=bundle

# What the next release would ship, resolved live over the planned members
GET /api/release-tracks/:id/snapshots/latest/release/preview?format=bundle

# STIX 2.0 bundle (the table of contents is always omitted)
GET /api/release-tracks/:id/snapshots/latest?format=bundle&stixVersion=2.0
```

**The collection object**

Every STIX 2.1 bundle begins with an `x-mitre-collection` object, the bundle's
bill of materials. Downstream consumers (the TAXII server among them) read it
from the emitted bundle, so it is always present in STIX 2.1 output. STIX 2.0
bundles omit this ATT&CK extension object. The object is projected from the
snapshot and the track's publication configuration:

- `id` — the track's configured `publication.collection_id`, defaulting to a
  value derived from the track UUID; constant across every snapshot of the
  track
- `created` — the track's configured `publication.created`, defaulting to the
  track creation time
- `modified` — the snapshot's `modified` timestamp
- `x_mitre_version` — the tagged version. Draft bundles omit the key: a draft
  has no publication version, and a placeholder would collide with a real
  first release. Draft bundles are therefore previews that do not conform to
  the ATT&CK specification's required-field rule.
- `created_by_ref` — the track's publication identity, inheriting the
  deployment's organization identity unless the track overrides it
- `object_marking_refs` — the track's publication markings, inheriting the
  deployment's default marking definitions unless the track overrides them.
  When neither scope configures markings, the object carries the marking
  definitions referenced by its contents.
- `name` — the release track name
- `description` — the snapshot's `snapshot_description`; falls back to the
  long-lived track `description` when no snapshot-local value is set
- `x_mitre_attack_spec_version` — the deployment's default ATT&CK spec version
- `x_mitre_contents` — every object in the bundle except marking definitions

Release commit freezes the resolved identity, markings, collection ID,
creation time, and spec version onto the released snapshot, so later
configuration changes never alter a published release. See
[Publication configuration](api-reference.md#publication-configuration).

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
