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
2. **Secondary objects** (groups, campaigns, detection strategies) were
   historically discovered through relationships to primary objects and their
   `x_mitre_domains` was projected at export time.
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
(`bundleTransformSchema`). Standard snapshots and materialized virtual
snapshots use this same pipeline; virtual composition metadata does not alter
STIX version serialization. The pipeline:

1. **Tier selection** — members are always exported. `include` (values
   `staged` and/or `candidates`; singular forms accepted) adds tiers.
   `state` (values `work-in-progress` and/or `awaiting-review`) narrows the
   added tiers; entries whose `object_status` is `reviewed` always pass the
   filter, mirroring the fact that members are inherently reviewed. `state`
   never affects members. `reviewed` is intentionally not a valid `state`
   value for this reason.
2. **Manifest replay** — the snapshot identifies an active graph manifest, or
   a complete linked pending manifest recovering from an interrupted
   activation, created at the same persistence boundary. The manifest records exact
   primary, relationship, secondary, supporting, and LinkById dependency
   revisions. Export hydrates those entries and performs no live graph
   expansion.
3. **Bounded secondary selection** — replay starts from the requested primary
   tiers, follows only dependency edges frozen in the manifest, and emits a
   relationship only when both exact endpoint revisions are selected.
4. **Supporting objects** — only identities and marking definitions frozen in
   the manifest and referenced by the selected graph are appended.
5. **LinkById conversion** — conversion uses only exact render targets frozen
   in the manifest and never falls back to a current database lookup.
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

### Canonical domains and the legacy graph renderer

Domain membership is object data, not an export projection. A cross-domain
object has one revision whose `x_mitre_domains` contains the complete domain
union. That same revision may appear in multiple domain bundles; its array is
not narrowed to the domain requested by a particular export.

The legacy and ephemeral graph renderer now preserves every nonempty
`x_mitre_domains` array it hydrates. Export-time inference remains only as a
compatibility fallback for exact historical domainless revisions pinned
before canonical-domain enforcement, including historical matrix revisions.
The fallback affects the rendered copy and does not update the stored
revision. The release-agnostic startup migration creates canonical replacement
revisions for the latest domainless object in every domain-bearing chain; all
subsequent content must persist canonical domains so virtual composition,
snapshot export, and ephemeral export observe the same membership.

Because snapshot contents are explicitly curated, primary entries do **not**
receive the legacy attack-id / deprecated / revoked filters. Secondary graph
capture retains the established bounded ATT&CK expansion rules and freezes
the resulting graph at snapshot creation.

#### Relationship and secondary-object consistency boundary

Release-track snapshots distinguish **primary** and **secondary** content:

- Primary objects are explicit snapshot tier entries. Members and quarantine
  record exact `(object_ref, object_modified)` revisions. Standard candidates
  and staged entries may instead store `"latest"` and are resolved just in
  time when a draft export includes those tiers.
- Secondary objects are not snapshot members. They are discovered when the
  snapshot is created because an exact-pinned SRO connects them to a primary,
  the bounded ATT&CK rules identify a detection strategy, or the bundle needs
  a supporting identity, marking definition, or LinkById render target.

Tagged standard membership is deterministic because release planning resolves
staged selectors before promoting them to members. Virtual materialization
likewise copies exact member revisions from tagged component snapshots and
never follows a component's later `track_latest` candidate movement.
When a virtual component declares `filters.domains`, the same allowed-domain
set bounds relationship-discovered secondary objects during graph capture.
An explicitly domain-bearing secondary object from another domain is not
included merely because it has a relationship to an included primary root.
Domainless supporting metadata remains eligible.

Every relationship revision stores server-controlled exact source and target
pins under `workspace.relationship_endpoints`. These fields identify the
precise `(object_ref, object_modified)` pair represented by each side of the
SRO. They are not emitted because bundle output includes only the `stix`
object. When an endpoint advances, Workbench creates a new SRO revision with
updated pins rather than rewriting the older SRO.

Each persisted snapshot references a tier-aware manifest. A pending manifest
and all of its entries are written before the snapshot is linked to it, then
activated after persistence succeeds. The snapshot link is the durable commit
record: replay can use and self-activate a complete linked pending manifest
after a process interruption.
A standard release replaces the draft manifest with one built from the
resolved release plan, so dynamic staged selectors become exact members.
Materialized virtual snapshots contain exact roots from the outset. Releasing
a virtual draft does not change those roots, so bundle preview and commit
reuse its existing manifest. This makes the preview the literal graph that
will be tagged rather than a second resolution against newer database state.

Active and pending manifests protect their exact dependencies. In-place
updates and hard deletes that would invalidate a primary or secondary
revision return `409`; lineage deletion is rejected when any version is
protected. Relationship source, target, and type changes are rejected.
Description-only relationship corrections remain allowed because the
relationship STIX payload used by older snapshots is frozen in the manifest.
Manifest entries may also freeze complete source payloads for an audited
operational baseline. The exact database revision pin remains mandatory and
protected; the frozen payload preserves the reviewed publication
representation for deterministic replay.
Deleting a draft snapshot or track removes its manifest and releases
protection that no other snapshot needs.

Existing data is upgraded by an idempotent migration. Only the latest
revision of each legacy relationship can be endpoint-pinned truthfully.
Pre-existing snapshot manifests are labeled `baseline_reconstruction`
because they describe the graph visible during migration rather than an
unknowable historical graph.

The deliberate exception is a standard draft export that explicitly includes
a candidate or staged entry stored as `"latest"`. That selector is defined to
move until release, so the selected draft graph is resolved for that request.
Release preview and commit resolve it again; a successful commit stores an
exact manifest. Members, tagged releases, materialized virtual snapshots, and
exact-selector draft tiers replay deterministically.

The graph and object payload are reproducible, but the bundle is not promised
to be byte-for-byte identical: the bundle envelope receives a newly generated
bundle ID. Consumers should compare the emitted STIX object set and revisions,
not the envelope UUID.

### Where validation happens

Query parameters are validated in the controller with Zod
([release-track-schemas.js](../../../app/lib/release-tracks/release-track-schemas.js)).
The OpenAPI spec declares the parameters loosely (`oneOf` string/array with
`allowReserved` for the list-valued `include`/`state`) so that both
comma-separated and repeated-parameter forms reach the Zod layer, which
normalizes and enforces the enums. Invalid values produce a 400
`InvalidQueryStringParameterError`.

Primary revision existence is validated separately in
`primary-revision-service.js`. This is intentionally a service-layer
invariant, because snapshot cloning, scheduled virtual materialization, and
release planning also enter through non-controller paths.

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
