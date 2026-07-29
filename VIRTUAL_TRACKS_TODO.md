# Virtual Release Tracks Completion Backlog

This backlog records the 2026-07-29 documentation-to-implementation audit of
virtual release tracks. Items are ordered by integrity risk and implementation
dependency. A checked item must include regression coverage and any necessary
OpenAPI, user/developer documentation, client, and Bruno updates.

## P0 — Snapshot lifecycle integrity

- [x] Make composition changes invalidate the previous materialization:
  - clear inherited `members`, `quarantine`, and `composition_resolution`;
  - expose that the resulting virtual draft is awaiting materialization;
  - require `POST /api/release-tracks/:id/virtual/snapshots/create` before the
    draft can be previewed or tagged as a release.
- [x] Reject generic member replacement for virtual tracks:
  - `POST /api/release-tracks/:id/contents`;
  - `POST /api/release-tracks/:id/snapshots/:modified/contents`.
    Virtual membership must only be produced by composition resolution.
- [ ] Implement the documented quarantine-resolution workflow, including
      `POST /api/release-tracks/:id/quarantine/promote`, or remove the quarantine
      strategy from the public contract until conflicts can be resolved.

## P1 — Composition validation and deterministic resolution

- [ ] Make request validation strict so misspelled keys such as
      `filters.domain` return 400 instead of silently disabling filtering.
- [ ] Validate component selectors according to `resolution_strategy`:
  - `specific_version` requires `version` and rejects `snapshot`;
  - `specific_snapshot` requires `snapshot` and rejects `version`;
  - `latest_tagged` rejects both selector fields.
- [ ] Make `priority` consistently required in Zod, Mongoose, OpenAPI, docs,
      and examples; reject duplicate priorities at the request boundary.
- [ ] Validate component existence, standard-track type, duplicate track IDs,
      and duplicate priorities when a virtual track is initially created, not only
      when composition is later updated or materialized.
- [ ] Validate `snapshot_schedule` by mode:
  - `manual` rejects `cron` and `dates`;
  - `cron` requires `cron` and rejects `dates`;
  - `dates` requires at least one date and rejects `cron`.
- [ ] Constrain or document accepted `filters.object_types` values and add
      direct regression coverage for exact-revision filtering.

## P1 — Deduplication correctness

- [ ] Treat the same exact object revision contributed by multiple components
      as one duplicate, not a conflicting revision.
- [ ] Ensure the `quarantine` strategy only quarantines genuinely different
      revisions of the same object.
- [ ] Attribute each surviving revision to one deterministic component so
      `objects_contributed` totals cannot exceed `summary.total_objects`.
- [ ] Add dedicated tests for all four strategies:
      `prioritize_latest_object`, `prioritize_latest_snapshot`,
      `prioritize_higher_priority`, and `quarantine`.

## P1 — Release provenance

- [ ] Populate virtual release `version_history[].component_versions` from the
      materialized snapshot's immutable `composition_resolution`.
- [ ] Define and test the provenance shape in Mongoose, OpenAPI, and user and
      developer documentation.

## P2 — Scheduled materialization

- [ ] Connect virtual `snapshot_schedule` metadata to the existing task
      scheduler.
- [ ] Implement manual, cron, and explicit-date scheduling semantics.
- [ ] Define failure behavior when a component has no matching tagged
      snapshot, including automation-run audit records and retry policy.
- [ ] Add scheduler integration tests and operational documentation.

## P2 — Contract decisions

- [ ] Decide whether virtual tracks can compose virtual tracks. The
      implementation currently rejects nesting while portions of the
      documentation say standard or virtual components are supported.
- [ ] Decide whether to implement the documented native-members/hybrid model.
      Prefer a dedicated standard component track unless a demonstrated use case
      requires a second membership authority inside virtual tracks.
- [ ] Decide whether to implement `resolve=true` and `resolved_content`.
      Remove these claims from documentation if eager materialization remains the
      only supported model.
- [ ] Implement caching and component-release notifications only if measured
      scale or an approved product workflow requires them; otherwise describe them
      as future considerations rather than current capabilities.

## Documentation corrections

- [ ] Replace `stix.type = "virtual"` with the top-level snapshot
      `type: "virtual"`.
- [ ] Remove the nonexistent snapshot-level `snapshot_id`; retain
      `version_history[].snapshot_id`.
- [ ] Correct response envelopes and the virtual-create response example.
- [ ] Align `composition_resolution` examples with fields actually generated,
      or implement the documented `by_type`, `by_tier`, and native statistics.
- [ ] Align documented error envelopes with centralized error-handler output.
- [ ] Include required `priority` values in every composition example.
- [ ] Clearly distinguish configured composition from a materialized draft and
      describe scheduled behavior as unavailable until scheduler execution exists.

## Verified complete

- [x] `filters.domains` hydrates and evaluates exact pinned revisions.
- [x] Public domain names and STIX `*-attack` names are normalized.
- [x] Multiple domain values are supported.
- [x] Objects without domain metadata are excluded when a domain filter is set.
- [x] Primary Enterprise, ICS, and Mobile matrices use their ATT&CK external ID
      as the established domain fallback.
- [x] Virtual tracks resolve only tagged snapshots and consume only component
      `members`.
- [x] Virtual tracks maintain independent draft/release history and use the
      shared snapshot retrieval and release endpoints after materialization.

## Current implementation slice

- [x] Add failing lifecycle and type-boundary regression tests.
- [x] Invalidate inherited materialization when composition changes.
- [x] Reject release previews and release commits for unmaterialized virtual
      drafts.
- [x] Reject generic contents replacement for virtual tracks.
- [x] Update OpenAPI, user/developer docs, and Bruno.
- [x] Run focused specs followed by the complete `npm test` suite.

Verification completed 2026-07-29:

- Focused virtual/release regression suite: 46 passing.
- Lint: passing.
- Full test suite: 960 passing (OpenAPI 2, config 21, API 913,
  middleware 24).
