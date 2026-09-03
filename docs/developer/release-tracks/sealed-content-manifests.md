# ADR: Sealed snapshot content manifests

Status: accepted 2026-09-02. Supersedes the opt-in "deterministic graph"
cache described in earlier revisions of [bundle-export.md](bundle-export.md).

## Context

Release-track bundle export had two paths. A tagged snapshot that had opted
into a graph manifest replayed pointers; every other export resolved a
"bounded" ATT&CK graph live, including relationship-discovered secondary
objects. Editors could delete and recreate the manifest, which regenerated the
frozen `x-mitre-collection` object with a new `modified` timestamp and new
bundle hashes. The collection object's `created`, `modified`,
`created_by_ref`, and `object_marking_refs` were each derived differently on
the two paths, and the track-level `object_marking_refs` field was never read
by either.

Separately, every new SDO revision cloned every active relationship pinned to
the previous revision so that relationship revisions stayed paired 1:1 with
endpoint revisions. The frontend also created new WIP revisions of both
endpoint objects on every relationship save. Editing one relationship
description therefore produced three revisions of that relationship, two
endpoint revisions, and a clone of every other relationship touching either
endpoint.

## Decisions

1. **Every snapshot owns a sealed content manifest from birth.** A manifest
   is computed whenever a snapshot's `members` tier is written: release
   commit, virtual materialization, bundle import, quarantine promotion, track
   clone, and track creation. Snapshots produced by candidate, staged, config,
   and metadata clones inherit the predecessor's manifest by reference. A
   manifest is deleted only when no snapshot in its track references it.
2. **One graph algorithm.** Roots are the exact `members` revisions. A
   relationship is selected when its `source_ref` and `target_ref` are both
   member IDs; the newest revision of each relationship lineage is chosen and
   discarded if it is revoked, deprecated, or a deprecated pattern. The member
   revisions are recorded as the manifest entry's exact endpoint pins.
   Identities and marking definitions referenced by emitted objects are
   supporting entries; LinkById targets outside the bundle are non-emitted
   `link_target` entries. No secondary SDO is ever discovered through a
   relationship. The bounded resolver survives only behind the deprecated
   ephemeral and legacy endpoints.
3. **Relationship revisions are no longer cloned when an endpoint advances.**
   `workspace.relationship_endpoints` remains as authoring context recorded on
   create, and the release preview flags relationships whose authored endpoint
   revision differs from the member revision being shipped. Exact pairing for
   a release lives in the sealed manifest.
4. **The `x-mitre-collection` object is a projection, not a stored object.**
   It is rendered at export from the snapshot and its manifest. The TAXII
   server and other consumers read it from emitted STIX 2.1 bundles, so it is
   always present in STIX 2.1 output and never present in STIX 2.0 output.
   - `id`: `config.publication.collection_id`, defaulting to
     `x-mitre-collection--<track uuid>`; immutable once the track has a release.
   - `created`: `config.publication.created`, defaulting to the track's
     `created`; immutable once the track has a release.
   - `modified`: the snapshot's `modified`.
   - `x_mitre_version`: the tagged version. Drafts omit the key. ATT&CK
     requires the field, so draft bundles are previews that do not conform to
     the ATT&CK specification; a placeholder such as `0.1` collides with a
     legitimate first release and is a lie about publication state.
   - `created_by_ref` and `object_marking_refs`: resolved through the
     publication inheritance rule below.
   - `description`: the snapshot's `snapshot_description`, falling back to
     the track description.
   - `x_mitre_contents`: every emitted object except marking definitions.
5. **Publication metadata inherits from the global scope unless overridden
   at the track scope.** `config.publication.created_by_ref` and
   `config.publication.object_marking_refs` each take the shape
   `{ inherit: true }` (default) or `{ inherit: false, value }`. Inherited
   values come from the organization identity and the default marking
   definitions in system configuration. Drafts resolve the rule at export so
   they preview the current configuration. Release commit freezes the
   resolved values into the tagged snapshot's `publication` field, so a later
   change to global or track configuration cannot alter a published release.
   The former top-level track `object_marking_refs` field is migrated into
   this rule and removed.
6. **Release commit seals.** A standard commit computes the manifest over the
   planned member set at commit time, so relationships added since the last
   seal are captured even when nothing was staged. A virtual commit publishes
   the materialization manifest unchanged, because the materialized draft is
   the artifact that was reviewed. Commit also stores a stable `bundle_id`
   and SHA-256 hashes of both serializations on the tagged snapshot. Draft
   bundles use a deterministic UUIDv5 derived from the track ID and snapshot
   `modified`; the bundle ID changes across snapshots while the collection ID
   stays constant per track.
7. **Tagged snapshots are immutable including notes.** `snapshot_description`
   is editable on drafts only. The graph create and delete endpoints are
   removed. The admin-only source-attested reconstruction endpoint remains
   and can replace an existing manifest when the caller names the manifest it
   expects to replace. The correction path for a mistaken release is
   deletion: an administrator may delete the track's most recent release with
   a typed version confirmation, which retracts its ledger entry, discards its
   manifest when unreferenced, and is audited as `delete_release`.
8. **Storage is named for what it holds.** Manifests live in
   `releaseTrackContentManifests` and `releaseTrackContentManifestEntries`
   with `release-track-content-manifest--` ids. A manifest header carries
   `seal_reason` (which write produced it), `schema_version` (2 for pointer
   manifests, 1 for the legacy frozen-relationship backfill), `state`, and
   the optional `source_attestation`; the former `resolver_version` and
   `baseline_reconstruction` fields are gone. `releaseTrackReconciliations`
   holds outstanding backref work only and is normally empty. See the
   collections table in [entities.md](entities.md).
8. **`include=staged,candidates` is a draft-only preview.** Included tier
   entries are resolved live and the same closure rule runs over members plus
   the included entries. Requesting `include` on a tagged snapshot is a `400`.

## Consequences

- Determinism is unconditional: exporting a tagged snapshot replays pointers
  and never queries relationships, and a draft replays its inherited members
  graph.
- Manifest storage is bounded by the number of member-changing writes, not
  the number of snapshots. Standard tracks already keep only one draft.
- Editing an object creates no relationship revisions; editing a relationship
  creates exactly one relationship revision.
- Existing databases are migrated in place: the `graph_manifest_id` field is
  renamed, tagged snapshots without a manifest are sealed and labeled as
  baseline reconstructions, drafts inherit or seal, publication values are
  frozen onto tagged snapshots, and bundle hashes are recomputed. Release-track
  exports in production had not been published externally (publication still
  used the legacy `GET /api/stix-bundles` endpoint), so recomputing hashes
  does not invalidate a distributed artifact.
- Tracks intended to replace a legacy domain bundle set
  `config.publication.collection_id` and `config.publication.created` to the
  canonical ATT&CK values before their first release.
