# Implementation Notes

## Database Indexes

```javascript
// Collection candidates lookup
db.collections.createIndex({ 'workspace.candidates.object_ref': 1 });
db.collections.createIndex({ 'workspace.candidates.status': 1 });

// Object collection membership
db.objects.createIndex({ 'workspace.collections.candidates': 1 });
db.objects.createIndex({ 'workspace.collections.staged': 1 });
db.objects.createIndex({ 'workspace.workflow.status': 1 });
```

## Validation Rules

- **Same object version** can only be in one tier per release-track snapshot
  (`members`, `staged`, `candidates`, or `quarantine`)
- **Different versions** of same object CAN exist in multiple tiers simultaneously
- Status transitions must be valid: WIP → Awaiting → Reviewed (no backwards transitions)
- Candidacy threshold must be valid enum value
- Object version must exist before adding as candidate (validate `stix.id` and `stix.modified` exist)
- Version pin (`object_modified`) is immutable once set for a tier entry

### Cross-tier revision enforcement

`app/lib/release-tracks/tier-revision-invariant.js` owns exact-revision
identity (`object_ref` + normalized `object_modified`) and normalization.
Every clone-based mutation passes through `snapshot-service.cloneSnapshot`;
track cloning uses the same normalizer. Tagging is the one in-place mutation,
so `versioning-service` normalizes before the atomic tag update. This covers
candidate adds, manual/automatic promotion, demotion, status transitions,
candidate pin changes, member sync, direct content replacement, bundle
import, standard/virtual snapshot creation, and release bumps without
route-specific guards.

Normalization keeps the first occurrence in the authoritative order
`members` → `staged` → `candidates` → `quarantine`. The order matches
backref reconciliation's defensive precedence: published membership wins
over in-flight workflow state, and resolved virtual membership wins over
quarantine. Exact duplicates within one tier are not collapsed because
quarantine entries may retain source-specific provenance.

`conflict-resolution.applyConflictPolicy` separately treats an exact
destination duplicate as an idempotent successful move. It does not reject
the incoming entry, so callers remove its source-tier occurrence. Conflict
policies remain responsible only for different revisions of one object.

## Performance Considerations

- Bulk operations should use batch updates
- Event handlers should be async and non-blocking
- Large collections (>10k objects) may need pagination
- Consider caching for `bump/preview` on large collections

### Snapshot history reads

Snapshot history is exposed as a nested collection at
`GET /api/release-tracks/:id/snapshots`; latest-snapshot retrieval is exposed
only at `GET /api/release-tracks/:id/snapshots/latest`. The track resource path
retains `DELETE` but intentionally has no `GET` method because the release-track
API was still prerelease when this contract was adopted. The collection route
also replaces the previously documented but unimplemented `?versions=all`
polymorphism, so a single endpoint never changes between a full snapshot object
and a list response.

`release-track-dynamic.repository.getSnapshotSummaries` performs tagged-state
filtering, descending timestamp ordering, pagination, and tier counts in
MongoDB. It projects counts with `$size` rather than hydrating the potentially
large tier arrays. The filter is applied to both the data query and
`countDocuments`, making `pagination.total` the filtered total.

The service shapes projected counts according to `snapshot.type`:

- standard: `members_count`, `staged_count`, `candidates_count`
- virtual: `members_count`, `quarantine_count`

This omits structurally inapplicable counts instead of making a zero value
ambiguous. An omitted `tagged` parameter adds no version predicate;
`tagged=true` matches string versions and `tagged=false` matches null draft
versions.

## Integrating with the Event-Driven Architecture

### Events Published

```javascript
// When object status changes within a collection (collection-scoped)
eventBus.emit('release-track:status-changed', {
  collectionId: 'x-mitre-collection--123',
  objectId: 'attack-pattern--eee',
  objectModified: '2024-01-12T09:00:00Z',  // Version pin
  oldStatus: 'work-in-progress',
  newStatus: 'awaiting-review',
  changedBy: 'user@example.com',
  changedAt: '2024-01-15T10:00:00Z'
});

// When object version is added to collection candidates
eventBus.emit('release-track:candidate-added', {
  collectionId: 'x-mitre-collection--123',
  objectId: 'attack-pattern--eee',
  objectModified: '2024-01-12T09:00:00Z',  // Version pin
  status: 'work-in-progress',
  addedBy: 'user@example.com'
});

// When object is promoted to staged
eventBus.emit('release-track:object-staged', {
  collectionId: 'x-mitre-collection--123',
  objectId: 'attack-pattern--ddd',
  objectModified: '2024-01-14T10:00:00Z',  // Version pin
  status: 'reviewed',
  promotedBy: 'auto' // or user email
});

// When collection is bumped
eventBus.emit('release-track:released', {
  collectionId: 'x-mitre-collection--123',
  version: '1.2',
  promotedCount: 1,
  promotedObjects: [
    {
      objectId: 'attack-pattern--ddd',
      objectModified: '2024-01-14T10:00:00Z'  // Version included in release
    }
  ],
  releasedBy: 'admin@example.com'
});
```

### Event Handlers

```javascript
// Auto-promote on status change (collection-scoped)
eventBus.on('release-track:status-changed', async (event) => {
  if (event.newStatus === 'reviewed') {
    const collection = await Collection.findById(event.collectionId);

    if (collection.workspace.config.auto_promote) {
      // Move this specific version from candidates to staged
      await promoteToStaged(
        collection,
        event.objectId,
        event.objectModified  // Preserve version pin
      );
    }
  }
});

// Update object's referenced_by tracking
eventBus.on('release-track:object-staged', async (event) => {
  // Update the specific object version
  await updateObject(
    { 'stix.id': event.objectId, 'stix.modified': event.objectModified },
    {
      $set: {
        'workspace.referenced_by.$[elem].tier': 'staged',
        'workspace.referenced_by.$[elem].status': event.status
      }
    },
    {
      arrayFilters: [
        {
          'elem.collection_id': event.collectionId,
          'elem.tier': 'candidates'
        }
      ]
    }
  );
});
```
