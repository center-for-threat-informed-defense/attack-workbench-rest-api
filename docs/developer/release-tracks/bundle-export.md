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

| Legacy usage                | Replacement                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------ |
| Domain-scoped ad hoc bundle | `GET /api/release-tracks/ephemeral/:domain`                                                            |
| Release/publication bundle  | `GET /api/release-tracks/:id/snapshots/latest?format=bundle` (or `/snapshots/:modified?format=bundle`) |

### Ephemeral endpoint parameter mapping

`GET /api/release-tracks/ephemeral/:domain` (default `format=bundle`)
delegates to `stix-bundles-service.exportBundle` so all of the legacy
object-selection logic above is preserved verbatim. The query-parameter
surface was simplified
(see [ephemeral-service.js](../../../app/services/release-tracks/ephemeral-service.js)):

| Legacy parameter                       | Disposition                                                                                                                                                                                                                                                                                |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `stixVersion`                          | **Preserved** (default changed to `2.1`)                                                                                                                                                                                                                                                   |
| `includeRevoked` / `includeDeprecated` | **Preserved** (default `false`)                                                                                                                                                                                                                                                            |
| `includeMissingAttackId`               | **Renamed** to `includeObjectsWithMissingAttackId` (default `false`)                                                                                                                                                                                                                       |
| `includeCollectionObject`              | **Renamed** to `includeToc` (default `true`). "TOC" describes what the `x-mitre-collection` object is and avoids overloading "collection". It applies only to STIX 2.1; STIX 2.0 always omits the object.                                                                                   |
| `collectionObjectVersion`              | **Removed** — fixed at `0.1`, signifying an ephemerally generated collection not connected to a release track                                                                                                                                                                              |
| `collectionObjectModified`             | **Removed** — fixed at the current timestamp                                                                                                                                                                                                                                               |
| `collectionAttackSpecVersion`          | **Removed** — fixed at the global default (`config.app.attackSpecVersion`)                                                                                                                                                                                                                 |
| `includeNotes`                         | **Removed** — notes are Workbench-native objects, not STIX objects, and are never emitted in bundles                                                                                                                                                                                       |
| `includeDataSources`                   | **Removed** — data sources are deprecated (ATT&CK Spec v3.3.0) and were marked deprecated/revoked in ATT&CK v18, so their inclusion is governed entirely by `includeDeprecated`/`includeRevoked`. Internally the delegation passes `includeDataSources: true` and lets those flags filter. |
| `useLegacyMethod`                      | **Removed** — the pre-v17 code path (`stix-bundles-service-old.js`) is not supported by the new endpoints                                                                                                                                                                                  |
| `state`                                | **Removed** — workflow status is now scoped to release tracks; a domain-scoped endpoint has no workflow-status concept                                                                                                                                                                     |

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
STIX version serialization. The design is recorded in
[sealed-content-manifests.md](sealed-content-manifests.md). The pipeline:

1. **Replay the sealed content manifest** — every snapshot references a
   manifest from birth. The manifest holds exact-revision pointers for the
   member roots, the relationships closed over those members, supporting
   identities and marking definitions, and non-emitted LinkById render
   targets. Export hydrates those pointers and nothing else: no relationship
   query, no domain inference, no "latest" lookup.
2. **Draft previews** — `include` (values `staged` and/or `candidates`;
   singular forms accepted) adds workflow tiers to a draft export and `state`
   (values `work-in-progress` and/or `awaiting-review`) narrows them; entries
   whose `object_status` is `reviewed` always pass. Because those tiers may
   hold dynamic `latest` selectors, an `include` export resolves the same
   closed-member graph live over members plus the included entries instead of
   replaying. Tagged snapshots reject `include` with `400`. Release previews
   of an unsaved planned snapshot resolve live the same way.
3. **Supporting objects** — identities and marking definitions referenced by
   emitted objects, plus the identity and markings the collection object
   itself references, are appended so the bundle is self-contained.
4. **LinkById conversion** — uses the exact render target pointers captured in
   the manifest.
5. **Assembly** (Zod transform) — notes are dropped, objects are conformed to
   `stixVersion` via the shared `lib/stix-conformance.js` helpers, and the
   bundle envelope is emitted (with `spec_version: "2.0"` only when
   `stixVersion=2.0` — STIX 2.1 removed `spec_version` from the bundle
   object).
6. **Collection object** — every STIX 2.1 bundle begins with an
   `x-mitre-collection` object; STIX 2.0 bundles never contain this ATT&CK
   extension object. It is a projection, never a stored object:
   - `id`: `config.publication.collection_id`, defaulting to
     `x-mitre-collection--<track uuid>`; constant across every snapshot of the
     track
   - `created`: `config.publication.created`, defaulting to the track's
     `created`
   - `modified`: the snapshot's `modified`
   - `x_mitre_version`: the tagged version; drafts omit the key
   - `created_by_ref` and `object_marking_refs`: the publication inheritance
     rule (track override, else global system configuration). When neither
     scope configures markings, the object carries the marking definitions
     referenced by its contents so it never ships unmarked
   - `name`: the snapshot's track name
   - `description`: `snapshot_description`, falling back to the track
     `description`
   - `x_mitre_attack_spec_version`: the deployment's ATT&CK spec version
   - `x_mitre_contents`: every bundle object except marking definitions,
     sorted by `object_ref`
   Drafts resolve the inheritance rule at export so they preview the current
   configuration; release commit freezes the resolved values onto the tagged
   snapshot as `publication`.
7. **Bundle identity and hashes** — a released snapshot stores a stable
   `bundle_id` assigned at commit; drafts derive a UUIDv5 from the track ID
   and snapshot `modified`. The bundle ID therefore changes across snapshots
   while the collection ID stays constant per track. Release commit serializes
   each STIX version with `JSON.stringify(bundle, null, 4)`, hashes the exact
   UTF-8 bytes with SHA-256, and stores both digests on the snapshot as
   `bundle_hashes` bound to the manifest ID.

### Sealed content manifests

`content-manifest-service.js` owns the one graph algorithm
(`resolveClosedGraph`):

- Roots are the exact `members` revisions; a member set naming two revisions
  of one STIX ID is rejected.
- A relationship lineage is a candidate when its `source_ref` and
  `target_ref` are both member IDs (indexed `$in` queries on the two ref
  fields, batched). The newest revision of each lineage is chosen first, then
  discarded if it is revoked, deprecated, or a deprecated pattern, so an older
  active revision is never resurrected by a newer inactive one. The member
  revisions become the manifest entry's `source` and `target` pins.
- No SDO is ever discovered through a relationship. The former `secondary`
  role survives only in legacy manifests.
- Supporting identities and marking definitions are pointers (versioned) or
  frozen payloads (unversioned marking definitions). LinkById targets outside
  the bundle are non-emitted `link_target` entries.

A manifest is sealed whenever a snapshot's `members` tier is written: track
creation, release commit, virtual materialization, bundle import, quarantine
promotion, and track clone. Candidate, staged, config, and metadata clones
inherit the predecessor's manifest by reference, so manifest storage is
bounded by member-changing writes rather than by snapshot count. Sealing
writes a pending manifest and its entries, re-verifies every pointer inside
that protection window, then saves the snapshot referencing the manifest and
activates it; a failed save discards the manifest. A manifest is discarded only
when no snapshot in its track references it.

A standard release commit seals a fresh manifest over the planned member set
inside the guarded tag update, even when nothing was staged, so relationships
created since the last seal are captured. The release preview reports exactly
what that seal would change: `relationships.added`, `relationships.removed`,
and `relationships.stale_endpoints` (relationships whose authoring-time
endpoint revision differs from the member revision being shipped). A virtual
commit publishes the materialization manifest unchanged, because the
materialized draft is the artifact that was reviewed.

Every relationship revision still records server-controlled exact endpoint
pins under `workspace.relationship_endpoints` at creation. They are authoring
context for the stale-endpoint warning and are not emitted. A new endpoint
revision no longer clones the relationship: exact pairing for a release lives
in the sealed manifest, so editing an object creates no relationship
revisions and editing a relationship creates exactly one.

Active and pending manifests protect every exact versioned dependency from
hard deletion. Persisted STIX content is globally immutable through PUT;
corrections are new POSTed revisions. Tagged snapshots are immutable including
their notes.

#### Historical baselines

Baselines whose relationships predate endpoint-pin capture use the admin-only
`POST /api/release-tracks/:id/snapshots/:modified/graph/reconstruct`. Its body
contains a source-bundle attestation and a decoupled pointer plan, not the
bundle payload. The server verifies that roots exactly equal tagged members,
every exact revision exists, each relationship's STIX refs agree with the
supplied endpoint IDs, the endpoint revisions are included, and required
supporting objects are present. Because every tagged snapshot already
references a sealed manifest, the request must name that manifest in
`replace_manifest_id`; the same attestation is idempotent and any other
current manifest is rejected. Replacement recomputes the bundle hashes. The
resulting manifest uses resolver version `source-bundle-pointer-v2`, records
the attestation, and sets `baseline_reconstruction: true`. Source plans may
carry `link_target` pointers and narrow `omitted_optional_defaults`
serialization hints exactly as before.

#### Migration

`20260902120000-seal-release-track-content-manifests.js` upgrades existing
databases in place: it renames `graph_manifest_id` to `content_manifest_id`,
seals a `baseline_reconstruction` manifest for every tagged snapshot that had
none, lets drafts share the manifest of a preceding tagged snapshot with an
identical member set (or seals them), moves the retired top-level
`object_marking_refs` into `config.publication.object_marking_refs`, freezes
`publication` and a `bundle_id` (preserving the manifest-derived envelope ID
those snapshots exported before) onto tagged snapshots, recomputes
`bundle_hashes`, and removes frozen `collection` entries. Only tracks in
`releaseTrackRegistry` are migrated: a dynamic `release-track--*` collection
without a registry document is an orphan of an interrupted or pre-registry
deletion whose snapshots routinely point at revisions that no longer exist.
The migration reports each orphan, discards any manifests it owns so they
cannot protect stale revisions, and leaves the collection for an operator to
drop. It also renames the manifest collections from `releaseTrackGraphManifest*`
to `releaseTrackContentManifest*`, moves manifest ids to the
`release-track-content-manifest--` prefix, replaces `resolver_version` and
`baseline_reconstruction` with a required `seal_reason`, removes the retired
`config.include_secondary_objects` block, and deletes completed
`releaseTrackReconciliations` records. Preview it with
`npm run preview:content-manifests`; a failure names the track, snapshot,
step, and missing references. The earlier
`20260730180000` migration keeps its relationship-pin backfill but no longer
creates manifests. Legacy schema-v1 manifests (frozen relationship payloads,
`secondary` entries) remain replayable.

### Canonical domains and the legacy graph renderer

Domain membership is object data, not an export projection. A cross-domain
object has one revision whose `x_mitre_domains` contains the complete domain
union. That same revision may appear in multiple domain bundles; its array is
not narrowed to the domain requested by a particular export.

The legacy and ephemeral graph renderer preserves every nonempty
`x_mitre_domains` array it hydrates. Export-time inference remains only as a
compatibility fallback for exact historical domainless revisions pinned
before canonical-domain enforcement, including historical matrix revisions.
The fallback affects the rendered copy and does not update the stored
revision. Release-track exports never infer domains: the sealed member set is
the complete SDO boundary, and virtual materialization applies component
`filters.domains` when it selects members.

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

- [content-manifests.spec.js](../../../app/tests/api/release-tracks/content-manifests.spec.js)
  — sealing at creation, inheritance through clones, resealing at release,
  preview inventories, source-attested replacement, draft-only `include`
- [publication-config.spec.js](../../../app/tests/api/release-tracks/publication-config.spec.js)
  — publication inheritance, overrides, freezing, and immutability
- [deterministic-graph-migration.spec.js](../../../app/tests/api/release-tracks/deterministic-graph-migration.spec.js)
  — the relationship-pin and content-manifest migrations
- [release-tracks-bundle.spec.js](../../../app/tests/api/release-tracks/release-tracks-bundle.spec.js)
  — snapshot bundle exports (tier selection, state filtering, STIX version
  conformance, collection object, LinkById, supporting objects, validation
  errors)
- [ephemeral-bundle.spec.js](../../../app/tests/api/release-tracks/ephemeral-bundle.spec.js)
  — ephemeral bundles (legacy-parity object selection, parameter mapping,
  TOC defaults, workbench format)
- [stix-bundles.spec.js](../../../app/tests/api/stix-bundles/stix-bundles.spec.js)
  — legacy endpoint behavior (still authoritative for
  `stix-bundles-service.exportBundle`, which the ephemeral endpoint reuses)
