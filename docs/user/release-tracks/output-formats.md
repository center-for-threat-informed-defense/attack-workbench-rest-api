## Output Formats

Release tracks (or rather, each snapshot) can serialize/export to multiple formats via query parameter:

```
GET /api/release-tracks/:id?format=<format>
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
- Adds UI-friendly object details to tier entries
- Suitable for Workbench UI rendering and release-track management workflows

Use `include` to narrow tier arrays in `workbench` responses:

```bash
GET /api/release-tracks/:id?include=members
GET /api/release-tracks/:id?include=staged
GET /api/release-tracks/:id?include=candidates
GET /api/release-tracks/:id?include=quarantine
GET /api/release-tracks/:id?include=all
```

### Format: `bundle`

Standard STIX 2.1 bundle format:

```json
{
  "type": "bundle",
  "id": "bundle--...",
  "objects": [
    {
      "type": "x-mitre-collection",
      "id": "x-mitre-collection--123",
      "x_mitre_version": "1.1",
      "x_mitre_contents": ["attack-pattern--aaa", "malware--bbb"],
      "name": "ATT&CK Enterprise"
    },
    {
      "type": "attack-pattern",
      "id": "attack-pattern--aaa",
      "name": "Technique A",
      // ... STIX properties only, no workflow info
    }
  ]
}
```

**Characteristics:**
- STIX 2.1 compliant
- Only includes `stix.*` properties
- No workflow states, no workspace data
- Suitable for external publication

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
        "content": { /* STIX object */ }
      }
    ],
    "attack-pattern": [
      {
        "filename": "attack-pattern--aaa.json",
        "content": { /* STIX object */ }
      }
    ]
  }
}
```

> **NOTE**: The `filesystemstore` is still a *concept* that will need additional refinement before it can be implemented. We will need to figure out an optimal way to return JSON files to the user. Optionally, we can attempt to generate an archive and serialize it over the wire, though this may be slow and error prone. Additionally, we can allow users to specify an output path via S3, FTP, etc. 


### Format Usage

```bash
# Workbench UI response
GET /api/release-tracks/:id
GET /api/release-tracks/:id?format=workbench

# Standard STIX bundle for publication
GET /api/release-tracks/:id?format=bundle

# FileSystemStore export is not implemented yet
GET /api/release-tracks/:id?format=filesystemstore  # Returns HTTP 501

# Dry run with detailed preview
GET /api/release-tracks/:id/bump/preview?format=workbench
```
