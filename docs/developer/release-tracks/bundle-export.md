# Bundle Export

This document explains how STIX bundle emission works after the introduction
of release tracks: what the legacy behavior was, why it changed, and how the
new endpoints are implemented.

## What was: `GET /api/stix-bundles`

Before release tracks, Workbench emitted STIX bundles exclusively through the
domain-scoped `GET /api/stix-bundles` endpoint
([stix-bundles-routes.js](../../../app/routes/stix-bundles-routes.js)). Its
service module ([stix-bundles-service.js](../../../app/services/stix/stix-bundles-service.js))
implements the ATT&CK bundle-composition rules:

1. **Primary objects** are retrieved by domain (`x_mitre_domains`):
   techniques, tactics, mitigations, software, matrices, analytics, data
   components, data sources.
2. **Secondary objects** (groups, campaigns, detection strategies) cannot be
   assigned domains by users; they are discovered through relationships to
   primary objects and their `x_mitre_domains` is inferred at export time.
3. **Relationship referential integrity**: a relationship is only emitted if
   both its `source_ref` and `target_ref` are present in the bundle.
4. **Supporting objects**: identities (`created_by_ref`) and marking
   definitions (`object_marking_refs`) referenced by bundle objects are
   fetched and appended so the bundle is self-contained.
5. **LinkById conversion**: `(LinkById: T1234)` tags in descriptions are
   converted to markdown citations.
6. **STIX version conformance**: objects are rewritten to STIX 2.0 or 2.1
   rules (see [lib/stix-conformance.js](../../../app/lib/stix-conformance.js),
   extracted from the legacy service so both pipelines share it).
7. **Collection object**: optionally, an `x-mitre-collection` object
   describing the bundle contents is prepended.

Bundle composition was configured entirely through query parameters
(`state`, `includeNotes`, `includeDataSources`, `useLegacyMethod`,
`includeCollectionObject`, `collectionObjectVersion`, ...) because there was
no persistent, curated representation of "a release" — every export was
ad hoc.

## What is: release-track exports and ephemeral bundles

Release tracks give Workbench a persistent, versioned model of a release
(members / staged / candidates tiers with per-track workflow status). That
changes what bundle emission needs to be:

- **Curated exports** come from a release-track snapshot. The snapshot
  already records exactly which object revisions belong to the release, so
  the export no longer needs domain queries, workflow-state heuristics, or
  attack-id filtering — it hydrates the pinned revisions and formats them.
- **Ad hoc domain exports** remain useful ("give me everything in enterprise
  right now"), which is what the ephemeral endpoint provides.

`GET /api/stix-bundles` is therefore **deprecated** (marked in the OpenAPI
spec) and will be removed in a future release. Its replacements:

| Legacy usage | Replacement |
|--------------|-------------|
| Domain-scoped ad hoc bundle | `GET /api/release-tracks/ephemeral/:domain` |
| Release/publication bundle | `GET /api/release-tracks/:id/snapshots/latest?format=bundle` (or `/snapshots/:modified?format=bundle`) |

### Ephemeral endpoint parameter mapping

`GET /api/release-tracks/ephemeral/:domain` (default `format=bundle`)
delegates to `stix-bundles-service.exportBundle` so all of the legacy
object-selection logic above is preserved verbatim. The query-parameter
surface was simplified
(see [ephemeral-service.js](../../../app/services/release-tracks/ephemeral-service.js)):

| Legacy parameter | Disposition |
|------------------|-------------|
| `stixVersion` | **Preserved** (default changed to `2.1`) |
| `includeRevoked` / `includeDeprecated` | **Preserved** (default `false`) |
| `includeMissingAttackId` | **Renamed** to `includeObjectsWithMissingAttackId` (default `false`) |
| `includeCollectionObject` | **Renamed** to `includeToc` (default `true`). "TOC" (table of contents) describes what the `x-mitre-collection` object actually is, and avoids overloading the term "collection". |
| `collectionObjectVersion` | **Removed** — fixed at `0.1`, signifying an ephemerally generated collection not connected to a release track |
| `collectionObjectModified` | **Removed** — fixed at the current timestamp |
| `collectionAttackSpecVersion` | **Removed** — fixed at the global default (`config.app.attackSpecVersion`) |
| `includeNotes` | **Removed** — notes are Workbench-native objects, not STIX objects, and are never emitted in bundles |
| `includeDataSources` | **Removed** — data sources are deprecated (ATT&CK Spec v3.3.0) and were marked deprecated/revoked in ATT&CK v18, so their inclusion is governed entirely by `includeDeprecated`/`includeRevoked`. Internally the delegation passes `includeDataSources: true` and lets those flags filter. |
| `useLegacyMethod` | **Removed** — the pre-v17 code path (`stix-bundles-service-old.js`) is not supported by the new endpoints |
| `state` | **Removed** — workflow status is now scoped to release tracks; a domain-scoped endpoint has no workflow-status concept |

Note on the bundle envelope: STIX 2.0 requires `spec_version` on the bundle
object, while STIX 2.1 removed it (objects declare their own `spec_version`
instead). Both the ephemeral endpoint and the legacy endpoint therefore stamp
`spec_version: "2.0"` on the envelope only when `stixVersion=2.0`.

### Release-track snapshot exports (`format=bundle`)

Implemented in
[export-service.js](../../../app/services/release-tracks/export-service.js)
(`exportSnapshot`) with the DTO transformation in
[export-schemas.js](../../../app/lib/release-tracks/export-schemas.js)
(`bundleTransformSchema`). The pipeline:

1. **Tier selection** — members are always exported. `include` (values
   `staged` and/or `candidates`; singular forms accepted) adds tiers.
   `state` (values `work-in-progress` and/or `awaiting-review`) narrows the
   added tiers; entries whose `object_status` is `reviewed` always pass the
   filter, mirroring the fact that members are inherently reviewed. `state`
   never affects members. `reviewed` is intentionally not a valid `state`
   value for this reason.
2. **Hydration** — any selected candidate/staged `"latest"` selectors are
   resolved for this export request, then the concrete
   `{object_ref, object_modified}` pairs are batch-fetched per STIX type via
   each repository's `findManyByIdAndModified`. The stored draft selectors are
   not mutated.
3. **Relationships** — the relationship service fetches the latest active
   relationship revisions whose `source_ref` and `target_ref` are both among
   the selected objects. Deprecated data-component `detects` relationships
   are excluded. Relationships remain indirect export-time content; they are
   not added to the snapshot tiers.
4. **Supporting objects** — referenced identities and marking definitions
   that are not themselves tier entries are fetched and appended.
5. **LinkById conversion** — same behavior as the legacy exporter, preferring
   objects already in the export before falling back to a database lookup.
6. **Assembly** (Zod transform) — notes are dropped, objects are conformed to
   `stixVersion` via the shared `lib/stix-conformance.js` helpers, and the
   bundle envelope is emitted (with `spec_version: "2.0"` only when
   `stixVersion=2.0` — STIX 2.1 removed `spec_version` from the bundle
   object).
7. **TOC** — unless `includeToc=false`, an `x-mitre-collection` object is
   prepended. Unlike the legacy exporter (which hardcoded per-domain
   metadata) and the ephemeral endpoint (which uses ephemeral defaults), the
   TOC is derived from the release track itself:
   - `id`: `x-mitre-collection--<track uuid>` — stable across exports of the
     same track
   - `name`/`description`/`created_by_ref`/`object_marking_refs`: from the
     snapshot metadata
   - `x_mitre_version`: the snapshot's tagged version, or `0.1` for drafts
   - `modified`: the snapshot's `modified` timestamp
   - `x_mitre_contents`: every bundle object except marking definitions
     (which are recorded in `object_marking_refs`), sorted by `object_ref`

Because snapshot contents are explicitly curated, the export intentionally
does **not** apply the legacy attack-id / deprecated / revoked filters — if a
revision is in the snapshot, it is exported.

#### Relationship and secondary-object consistency boundary

Release-track snapshots distinguish **primary** and **secondary** content:

- Primary objects are explicit snapshot tier entries. Members and quarantine
  record exact `(object_ref, object_modified)` revisions. Standard candidates
  and staged entries may instead store `"latest"` and are resolved just in
  time when a draft export includes those tiers.
- Secondary objects are not snapshot members. They are discovered because a
  primary object references them through an embedded STIX ID, an SRO connects
  two selected primary objects, or the bundle needs a supporting identity or
  marking definition.

Tagged standard membership is deterministic because release planning resolves
staged selectors before promoting them to members. Virtual materialization
likewise copies exact member revisions from tagged component snapshots and
never follows a component's later `track_latest` candidate movement. Draft
exports that explicitly include dynamic candidate/staged tiers are snapshots
of the latest revisions at export time. Secondary content is also resolved
just in time during bundle generation.

Relationships are the largest consistency boundary. Current SRO
`source_ref`/`target_ref` fields identify STIX object IDs, not exact
`(object_id, object_modified)` revisions. An SRO can consequently describe the
whole revision chain of each endpoint rather than one precise pair of SDO
entities. The exporter resolves the latest active relationship revisions when
the bundle is requested. This creates several tradeoffs:

- exporting the same tagged snapshot at different times can produce different
  relationship objects or TOC contents;
- relationship revisions are not represented in snapshot history,
  release-track backrefs, or composition audit metadata;
- revoking a relationship can remove it from an older snapshot export, while
  creating a relationship can add it to that export;
- each bundle request performs a relationship query, although the query is
  constrained to relationships whose two endpoints are already selected.

Consumers that require byte-for-byte or graph-level reproducibility must
archive the emitted bundle.

Making bundle graphs deterministic requires a separate, high-risk data-model
change rather than virtual composition re-resolution. A future design must
version-control relationships, pin each SRO endpoint to an exact SDO revision,
and likely clone every affected SRO whenever a new endpoint revision is
created. It must also persist an export manifest containing the selected
relationship and other secondary-object revisions. That one-to-one SDO/SRO
model has significant migration, write-amplification, concurrency, and
database-storage costs and is deliberately deferred pending design and
measurement.

### Where validation happens

Query parameters are validated in the controller with Zod
([release-track-schemas.js](../../../app/lib/release-tracks/release-track-schemas.js)).
The OpenAPI spec declares the parameters loosely (`oneOf` string/array with
`allowReserved` for the list-valued `include`/`state`) so that both
comma-separated and repeated-parameter forms reach the Zod layer, which
normalizes and enforces the enums. Invalid values produce a 400
`InvalidQueryStringParameterError`.

### Regression tests

- [release-tracks-bundle.spec.js](../../../app/tests/api/release-tracks/release-tracks-bundle.spec.js)
  — snapshot bundle exports (tier selection, state filtering, STIX version
  conformance, TOC, LinkById, supporting objects, validation errors)
- [ephemeral-bundle.spec.js](../../../app/tests/api/release-tracks/ephemeral-bundle.spec.js)
  — ephemeral bundles (legacy-parity object selection, parameter mapping,
  TOC defaults, workbench format)
- [stix-bundles.spec.js](../../../app/tests/api/stix-bundles/stix-bundles.spec.js)
  — legacy endpoint behavior (still authoritative for
  `stix-bundles-service.exportBundle`, which the ephemeral endpoint reuses)
