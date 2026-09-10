## Workflow Examples

### Example 1: Standard Release Cycle

```bash
# 1. Create initial collection
POST /api/release-tracks/new
{ "name": "My Release", ... }
# Creates: snapshot 1, x_mitre_version: null

# 2. Add objects as candidates
POST /api/release-tracks/release--123/candidates
{ "object_refs": [{ "id": "attack-pattern--...", "modified": "latest" }] }
# Creates: snapshot 2, version: null

# 3. Promote accepted candidates to staged
POST /api/release-tracks/release--123/candidates/promote
{ "object_refs": ["attack-pattern--..."] }
# Creates: snapshot 3, version: null

# 4. Update metadata
POST /api/release-tracks/release--123/meta
{ "description": "Updated description" }
# Creates: snapshot 4, version: null

# 5. Ready for first release - staged objects become members
POST /api/release-tracks/release--123/snapshots/latest/release
{ "increment": "major" }
# Preserves snapshot 4 and creates snapshot 5, version: "1.0"

# 6. Continue development through the same candidate workflow
POST /api/release-tracks/release--123/candidates
{ "object_refs": [{ "id": "malware--...", "modified": "latest" }] }
POST /api/release-tracks/release--123/candidates/promote
{ "object_refs": ["malware--..."] }
# Creates snapshots 6 and 7

# 7. Minor release
POST /api/release-tracks/release--123/snapshots/latest/release
{ "increment": "minor" }
# Preserves snapshot 7 and creates snapshot 8, version: "1.1"
```

**Resulting Timeline:**
```
snapshot 1: initial empty draft
snapshot 2: candidate added
snapshot 3: candidate staged
snapshot 4: preserved pre-1.0 draft
snapshot 5: version "1.0" ← RELEASE
snapshot 6: next candidate added
snapshot 7: preserved pre-1.1 draft
snapshot 8: version "1.1" ← RELEASE
```

### Example 2: Selective Release Tagging

```bash
# Create several drafts through ordinary metadata/workflow changes
POST /api/release-tracks/release--456/meta  # draft 2
POST /api/release-tracks/release--456/meta  # draft 3
POST /api/release-tracks/release--456/meta  # draft 4
POST /api/release-tracks/release--456/meta  # draft 5

# Release draft 2 now and then release the latest remaining draft
POST /api/release-tracks/release--456/snapshots/<draft-2-timestamp>/release
{ "version": "1.0" }

POST /api/release-tracks/release--456/snapshots/latest/release
{ "version": "1.1" }
```

**Resulting Timeline:**
```
snapshot 1: version: null (skipped)
snapshot 2: preserved pre-1.0 draft
snapshot 3: version: null (skipped)
snapshot 4: version: null (skipped)
snapshot 5: preserved pre-1.1 draft
snapshot 6: version: "1.0" ← RELEASE (created now from snapshot 2)
snapshot 7: version: "1.1" ← RELEASE (created now from snapshot 5)
```

Selecting a historical draft does not backdate a release: its tagged clone is
created at the current time and must follow the current version lineage.

### Example 3: Handling Already-Released Snapshots

```bash
# Tag latest snapshot
POST /api/release-tracks/release--789/snapshots/latest/release
{ "version": "1.0" }
# Success: snapshot tagged as v1.0

# Attempt to release the same snapshot again
POST /api/release-tracks/release--789/snapshots/latest/release
{ "version": "1.1" }
# Error: AlreadyReleasedError - "This snapshot has already been tagged as version 1.0"

# Solution: Make a supported draft change first
POST /api/release-tracks/release--789/meta
{ "description": "Prepare the next release" }
# Creates new snapshot

# Now release the new snapshot
POST /api/release-tracks/release--789/snapshots/latest/release
{ "version": "1.1" }
# Success: new snapshot tagged as v1.1
```
