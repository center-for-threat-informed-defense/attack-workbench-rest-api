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
| `includeCollectionObject` | **Renamed** to `includeToc` (default `true`). "TOC" (table of contents) describes what the `x-mitre-collection` object actually is, and avoids overloading the term "collection". It applies only to STIX 2.1; STIX 2.0 always omits the object. |
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
2. **Graph selection** — a member-only export replays the schema-v2 graph when
   the tagged snapshot has explicitly opted in. Graphless snapshots resolve a
   live bounded graph. Any request that includes `staged` or `candidates` is
   also live; determinism is promised for `members` only.
3. **Closed member graph** — persisted deterministic graphs emit only exact
   `members` revisions as graph objects. A relationship is selected only when
   both of its stored exact endpoint revisions are members; relationships do
   not pull additional SDOs into the graph. Persisted schema-v2 manifests store
   exact-revision pointers, not cloned STIX payloads.
4. **Supporting objects** — referenced identities and marking definitions are
   appended. Versioned supporting objects use pointers; unversioned marking
   definitions retain a frozen payload in persisted graphs.
5. **LinkById conversion** — deterministic replay uses the exact render target
   pointer captured in the graph. Live resolution uses the current eligible
   target.
6. **Assembly** (Zod transform) — notes are dropped, objects are conformed to
   `stixVersion` via the shared `lib/stix-conformance.js` helpers, and the
   bundle envelope is emitted (with `spec_version: "2.0"` only when
   `stixVersion=2.0` — STIX 2.1 removed `spec_version` from the bundle
   object).
7. **TOC** — for STIX 2.1, unless `includeToc=false`, an
   `x-mitre-collection` object is prepended. STIX 2.0 always omits this ATT&CK
   extension object. Graphless 2.1 exports derive it from live snapshot
   metadata. Graph creation freezes it as a `collection` manifest entry and
   every member-only 2.1 replay uses that stored value:
   - `id`: `x-mitre-collection--<track uuid>` — stable across exports of the
     same track
   - `created_by_ref`: the configured organization identity's STIX ID
   - `name`/`object_marking_refs`: from the snapshot metadata
   - `description`: from `snapshot_description` when present, otherwise the
     snapshot's long-lived track `description`
   - `x_mitre_version`: the snapshot's tagged version, or `0.1` for drafts
   - `created`: the first cached collection object's creation timestamp for
     the release track
   - `modified`: the current graph manifest's creation timestamp
   - `x_mitre_contents`: every bundle object except marking definitions
     (which are recorded in `object_marking_refs`), sorted by `object_ref`
8. **Deterministic file identity** — graph-backed member-only bundles use the
   graph manifest UUID for the bundle envelope ID. After graph creation, the
   server serializes each STIX version with `JSON.stringify(bundle, null, 4)`,
   hashes those exact UTF-8 bytes with SHA-256, and stores both digests on the
   snapshot as `bundle_hashes`. The graph, collection object, notes, and hashes
   form one immutable cache boundary. Snapshot-note edits return `409 Conflict`
   until the graph is deleted; callers then edit the notes and regenerate the
   graph and hashes.

The `20260805150000-repair-release-track-bundle-integrity` forward migration
applies these invariants to existing graph manifests. It creates or rewrites
each frozen collection entry with the track-derived ID and current configured
organization identity, then recomputes both hashes for every linked tagged
snapshot. Historical draft graphs remain live exports and therefore do not
retain deterministic hashes.

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
revision. The release-agnostic startup migration creates a canonical
replacement only when an exact collection TOC entry proves the object's
domain. Unmapped legacy objects remain unchanged, are reported for follow-up,
and keep the temporary validation bypasses active. All subsequent content must
persist canonical domains so virtual composition, snapshot export, and
ephemeral export observe the same membership.

Because snapshot contents are explicitly curated, primary entries do **not**
receive the legacy attack-id / deprecated / revoked filters. Graphless and
candidate/staged exports retain the established live bounded ATT&CK expansion
rules. A persisted deterministic member graph instead closes over `members`
and never discovers additional SDO revisions through relationships.

#### Closed-member relationship consistency boundary

Release-track exports distinguish persisted deterministic content from live
compatibility expansion:

- Primary objects are explicit snapshot tier entries. Members and quarantine
  record exact `(object_ref, object_modified)` revisions. Standard candidates
  and staged entries may instead store `"latest"` and are resolved just in
  time when a draft export includes those tiers.
- A persisted deterministic graph contains only `members` as graph objects.
  Relationships, supporting identities/marking definitions, and non-emitted
  LinkById targets are dependencies, not implicit membership. A relationship
  endpoint outside `members` causes that relationship to be omitted.
- Graphless and candidate/staged exports remain live and may use the legacy
  secondary-object expansion rules. They carry no determinism guarantee.

Tagged standard membership is deterministic because release planning resolves
staged selectors before promoting them to members. Virtual materialization
likewise copies exact member revisions from tagged component snapshots and
never follows a component's later `track_latest` candidate movement.
When a virtual component declares `filters.domains`, virtual materialization
uses those filters to choose exact primary members. Deterministic graph capture
does not perform a second domain-inference pass: the materialized member set is
the complete SDO boundary. Domainless supporting metadata remains eligible.

Every relationship revision stores server-controlled exact source and target
pins under `workspace.relationship_endpoints`. These fields identify the
precise `(object_ref, object_modified)` pair represented by each side of the
SRO. They are not emitted because bundle output includes only the `stix`
object. When an endpoint advances, Workbench creates a new SRO revision with
updated pins rather than rewriting the older SRO.

Snapshots are graphless by default. After tagging, an editor may call
`POST /api/release-tracks/:id/snapshots/:modified/graph`. The service builds a
schema-v2 closed-member graph. It rejects duplicate member revisions for one
STIX ID, selects relationship revisions only when both exact endpoint pins are
members, writes a pending manifest and decoupled entry rows, rehydrates every
pointer while those pending rows already protect deletion, then atomically
attaches the manifest ID to the still-tagged snapshot. Replay can self-activate
a complete linked pending manifest after an interrupted activation. `DELETE`
on the same graph resource detaches and removes it. Each manifest also owns one
frozen `x-mitre-collection` entry. The attached snapshot records SHA-256 values
for the exact STIX 2.0 and STIX 2.1 browser-download serialization, bound to the
same manifest ID.

Historical baselines whose relationships predate endpoint-pin capture require
a different, admin-only path:
`POST /api/release-tracks/:id/snapshots/:modified/graph/reconstruct`. Its body
contains a source-bundle attestation and a decoupled pointer plan, not the
bundle payload. The caller must independently verify the named bundle and its
SHA-256 digest. The server then verifies that roots exactly equal tagged
members, every exact revision exists, each relationship's STIX refs agree with
the supplied endpoint IDs, the endpoint revisions are included, and required
supporting objects are present. Versioned entries are always pointers; only an
unversioned marking definition may be frozen by value. The resulting manifest
uses resolver version `source-bundle-pointer-v2`, records the attestation, and
sets `baseline_reconstruction: true`.

Source plans may contain `link_target` pointers for objects outside the emitted
domain bundle. They are hydrated for LinkById conversion but are not emitted.
Active ATT&CK-ID targets are preferred; a unique inactive historical target is
accepted only when no active v19.1 target exists.

The v19.1 production bootstrap uses this path without importing the published
bundles. Because each official domain bundle contains one revision per STIX
ID, it can infer legacy SRO endpoint revisions by joining `source_ref` and
`target_ref` to those unique objects. Before tagging, the script batch-hydrates
the entire pointer plan from Workbench and compares its STIX object set with
the source bundle. This is the missing provenance that live database traversal
cannot recover after endpoint lineages have advanced. The bootstrap routes
entity pointers to `attackObjects` and relationship pointers to the dedicated
`relationships` collection. Its pre-tag comparison mirrors export-time
LinkById rendering. A pointer may carry a narrow serialization hint when the
attested source omitted a persisted optional `revoked: false` or
`x_mitre_remote_support: false` default. Most source objects explicitly emit
those false values and retain them. True values and every other payload
difference remain significant. Ordinary release-track exports retain their
existing serialization.

Ordinary graph creation uses the compound indexes on
`workspace.relationship_endpoints.{source,target}` rather than scanning all
relationships. Exact member revisions are queried in bounded batches. A
candidate survives only when both exact endpoint pairs occur in `members`.
Candidates are then grouped by relationship lineage and exact endpoint pair;
the newest revision wins before revoked, deprecated, and obsolete-pattern
filters run, so an older active revision cannot be resurrected by a newer
inactive revision.

The immediately preceding tagged graph also seeds relationship candidates
whose exact endpoints remain members. This creates a provenance chain from a
source-attested v19.1 baseline, including legacy relationships whose current
`workspace.relationship_endpoints` metadata cannot be reconstructed
truthfully. The indexed database query is still performed on every graph so a
new relationship connecting unchanged members is discovered. Current exact
relationship revisions override carried history; removed or revised member
endpoints naturally drop predecessor edges.

Ordinary manifests created by this algorithm use resolver version
`closed-member-graph-v3`. Existing `bounded-member-graph-v2` manifests are not
rewritten in place. To repair an affected post-v19.1 graph, preserve the
source-attested v1.0 baseline, DELETE only the affected later snapshot's graph,
then POST that graph again. If the tagged snapshot's member pins are already
correct, deleting the snapshot itself is unnecessary; the recreated graph uses
v1.0 (or the immediately preceding tagged graph) as its predecessor. Published
artifacts produced from the removed graph must be regenerated.

Active and pending manifests protect every exact versioned dependency from
hard deletion. Persisted STIX content is globally immutable through PUT,
whether or not it is graph-pinned; corrections are new POSTed revisions.
Schema-v2 relationships therefore need no frozen payload or mutation
exemption. Legacy schema-v1 manifests still replay their frozen relationship
payloads. Deleting a graph or track releases protection that no other graph or
tagged membership needs.

Existing data is upgraded by an idempotent migration. Only the latest
revision of each legacy relationship can be endpoint-pinned truthfully.
Pre-existing snapshot manifests are labeled `baseline_reconstruction`
because they describe the graph visible during migration rather than an
unknowable historical graph. They must not be represented as historical truth.
A verified external bundle can reconstruct a historical graph through the
admin operation above; without such an artifact, exact legacy endpoint
selection remains unknowable.

Drafts and tagged snapshots without graphs resolve live. Candidate/staged
exports also resolve live even when the snapshot has a graph, because those
tiers are expected to move. Release preview is live and release commit does
not create a graph. Determinism begins only with the explicit tagged-snapshot
graph operation and applies only to member exports.

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
