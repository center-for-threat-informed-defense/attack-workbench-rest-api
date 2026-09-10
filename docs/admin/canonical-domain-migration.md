# ATT&CK Canonical-Domain Migration

## Purpose

Workbench formerly allowed some domain-bearing ATT&CK objects to omit
`x_mitre_domains`. Bundle export inferred or projected a domain later. That
produced separate domain-narrowed representations of a single object and made
virtual-track domain filters dependent on export-time behavior.

Migration
`20260730230000-backfill-canonical-x-mitre-domains.js` replaces that model with
canonical object data:

- one object revision carries its complete domain union;
- a cross-domain revision can appear unchanged in multiple domain bundles;
- virtual `filters.domains` uses inclusive set intersection;
- new reviewed content cannot rely on a missing-domain validation bypass.

The migration runs automatically at server startup when database migrations
are enabled.

## Domain source

Startup does not access GitHub or another network service, and the migration
is not coupled to a particular ATT&CK release manifest. It reads the persisted
Enterprise, ICS, and Mobile `x-mitre-collection` revisions and indexes their
exact `x_mitre_contents` pins.

Domain membership is inferred from exact collection TOC membership:

- one canonical collection TOC containing an exact revision produces one domain;
- multiple canonical TOCs containing the exact revision produce the complete union;
- bundle appearance and `workspace.collections` backrefs are ignored.

That distinction is essential. Legacy imports recorded `workspace.collections`
for every imported bundle object, including campaigns and groups discovered as
secondary relationship content. Legacy bundle rendering could also project a
primary target's domains onto those secondary payload copies. Neither signal
proves that the secondary object was a primary member of that domain.

The migration examines the latest revision of every domain-bearing ATT&CK
lineage: techniques, campaigns, mitigations, groups, malware, tools,
analytics, assets, data components, data sources, detection strategies,
matrices, and tactics. This includes active, revoked, and deprecated content.
Identities, marking definitions, collections, and relationships are excluded
because their ADM schemas do not define `x_mitre_domains`.

## Repair behavior

Only the latest revision in each affected object lineage is repaired.
Historical revisions remain byte-for-byte historical and may still be
domainless.

Active latest revisions are reposted through the ordinary service `create`
workflow. This creates a new revision, runs ADM validation and lifecycle hooks,
and triggers the same relationship and standard-track member-sync behavior as
an API POST. Reposts are processed in batches of 50 with at most four service
creates in flight. Analytics, data components, and detection strategies are
serialized because their backref hooks perform read-modify-write updates.
Release-track member sync is serialized per track, so concurrent group,
campaign, or matrix reposts cannot overwrite one another's candidate changes.

Revoked and deprecated latest revisions use a narrow exception. The migration
duplicates the stored entity directly, preserves `revoked` and
`x_mitre_deprecated`, assigns canonical domains, and advances
`stix.modified`. It removes copied `workspace.release_tracks` pointers because
those backrefs belong to an exact old revision, removes the resolved
`x_mitre_domains` validation issue, and invokes release-track member sync
directly. It does not emit a generic created event or claim that ordinary
inactive-content hooks ran.

Inactive replacements use bounded concurrent native-driver inserts.
The migration deliberately omits `_id` and lets the native MongoDB driver
performing the insert generate it. This avoids passing a Mongoose BSON value
to migrate-mongo when those dependencies use different BSON major versions.
Replacement/original verification is performed once per batch, and per-object
automation audit records are inserted together with stable sequence numbers.

The old revision is never updated or deleted in either path.

## Unmapped-object handling

Before creating any object revision, the migration resolves the complete
latest domainless candidate set from exact collection TOC membership. If an
object has no recognized canonical TOC pin, the migration leaves it unchanged.
Neither legacy `workspace.collections` appearances nor the absence of a TOC
match proves Enterprise membership. A completed run records these objects in
`warnings.unmapped_domainless_objects`, increments `unmapped_skipped`, and
does not create per-object repair audit items for them.

Persisted missing-domain validation bypasses are deleted only after all object
repairs succeed **and** verification finds no remaining latest domainless
target. When unmapped objects remain, the bypasses are retained so startup can
complete without activating a contract the database does not yet satisfy. A
failed mapped repair still fails startup. On restart, already repaired
lineages are skipped and only the remaining mapped work is retried.

## Verification and audit

Inspect the latest run:

```javascript
db.automationRuns.findOne(
  { name: '20260730230000-backfill-canonical-x-mitre-domains' },
  { sort: { started_at: -1 } },
);
```

Important counters are:

- `active_reposts`
- `inactive_clones`
- `active_batches`
- `inactive_batches`
- `unmapped_skipped`
- `revoked`
- `deprecated`
- `bypasses_removed`
- `failed`

A completed run with complete canonical provenance reports all verification
values as zero. A completed run with unmapped objects may instead report
nonzero domainless-object and bypass counts alongside the warning described
above:

```javascript
{
  remaining_latest_domainless_target_objects: 0,
  remaining_domain_validation_bypasses: 0
}
```

Inspect per-object actions by using the run's `run_id`:

```javascript
db.automationRunItems.find({ run_id: '<run-id>' }).sort({ sequence: 1 });
```

## After migration

Active reposts and inactive clones may become candidates on standard tracks
that already contain those object lineages. Review and release those
candidates through the normal standard-track workflow before materializing
the next virtual baseline.

Exact historical domainless revisions remain retrievable. Legacy graph
rendering retains a compatibility fallback for those pins, but current
canonical revisions and new releases do not depend on that fallback.

The down migration is intentionally a no-op. Removing the replacement
revisions or restoring permission to create invalid reviewed content would
discard history and weaken the new contract.
