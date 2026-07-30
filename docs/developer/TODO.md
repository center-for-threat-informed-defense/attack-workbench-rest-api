# Release Track TODOs

## Current implementation slice — Deterministic standard releases

- [x] Preserve `modified: "latest"` and omitted candidate selectors as dynamic
  references through the candidate and staged tiers; preserve explicit
  timestamps as exact revision pins.
- [x] Resolve every dynamic staged reference to the actual latest
  `stix.modified` timestamp during standard release planning, before conflict
  detection, preview rendering, or commit.
- [x] Ensure tagged members contain exact revisions only and that preview and
  commit use the same release-planning rules.
- [x] Make dynamic candidate/staged references safe in tier comparison,
  Workbench enrichment, bundle rendering, back-reference reconciliation, and
  member-sync paths.
- [x] Add regression coverage for dynamic and explicit candidate promotion,
  release-time resolution after a newer revision is created, historical
  release targeting, conflict handling, and member immutability.
- [x] Update OpenAPI, user/developer documentation, frontend guidance,
  `internalattack`, and Bruno as required by the corrected contract.
- [x] Run focused tests, lint, OpenAPI validation, and the complete `npm test`
  suite.
- [x] Apply logic review, inspect the final diff, and propose conventional
  commit messages.

Verification result (2026-07-30):

- The combined release, back-reference, change-capture, bundle,
  tier-invariant, and virtual-determinism regression group passes (81); the
  strengthened release-planning spec passes (19).
- OpenAPI validation passes (2), backend lint passes, and the required clean
  full suite passes with routine logs suppressed (OpenAPI 2, config 21, API
  945, middleware 24).
- The focused `internalattack` release-track suite passes (30), its complete
  suite passes (247), and changed-file Ruff checks pass.
- Relevant REST API, `internalattack`, and Bruno diffs pass whitespace checks.

## Virtual release tracks

This section records the 2026-07-29 documentation-to-implementation audit of
virtual release tracks. Items are ordered by integrity risk and implementation
dependency. A checked item must include regression coverage and any necessary
OpenAPI, user/developer documentation, client, and Bruno updates.

The completed P0 implementation and verification records remain in the dated
sections below. The following items constitute the active virtual-track
completion backlog.

### P1 — Composition validation and deterministic resolution

- [x] Make request validation strict so misspelled keys such as
  `filters.domain` return 400 instead of silently disabling filtering.
- [x] Validate component selectors according to `resolution_strategy`:
  - `specific_version` requires `version` and rejects `snapshot`;
  - `specific_snapshot` requires `snapshot` and rejects `version`;
  - `latest_tagged` rejects both selector fields.
- [x] Make `priority` consistently required in Zod, Mongoose, OpenAPI, docs,
  and examples; reject duplicate priorities at the request boundary.
- [x] Validate component existence, standard-track type, duplicate track IDs,
  and duplicate priorities when a virtual track is initially created, not only
  when composition is later updated or materialized.
- [x] Validate `snapshot_schedule` by mode:
  - `manual` rejects `cron` and `dates`;
  - `cron` requires `cron` and rejects `dates`;
  - `dates` requires at least one date and rejects `cron`.
- [x] Constrain or document accepted `filters.object_types` values and add
  direct regression coverage for exact-revision filtering.

### P1 — Deduplication correctness

- [x] Treat the same exact object revision contributed by multiple components
  as one duplicate, not a conflicting revision.
- [x] Ensure the `quarantine` strategy only quarantines genuinely different
  revisions of the same object.
- [x] Attribute each surviving revision to one deterministic component so
  `objects_contributed` totals cannot exceed `summary.total_objects`.
- [x] Add dedicated tests for all four strategies:
  `prioritize_latest_object`, `prioritize_latest_snapshot`,
  `prioritize_higher_priority`, and `quarantine`.

### P1 — Release provenance

- [x] Populate virtual release `version_history[].component_versions` from the
  materialized snapshot's immutable `composition_resolution`.
- [x] Define and test the provenance shape in Mongoose, OpenAPI, and user and
  developer documentation.

### P2 — Scheduled materialization

- [x] Connect virtual `snapshot_schedule` metadata to the existing task
  scheduler. This is required for virtual-track completion, not an optional
  future enhancement.
- [x] Implement `cron` execution so each matching schedule occurrence
  materializes a new virtual draft through the same lifecycle and validation
  used by `POST /api/release-tracks/:id/virtual/snapshots/create`.
- [x] Implement `dates` execution so every configured timestamp materializes
  exactly one virtual draft, including deterministic handling for restart
  recovery, missed timestamps, and duplicate-delivery prevention.
- [x] Preserve `manual` semantics: store no executable schedule and create
  drafts only through the explicit virtual snapshot-creation endpoint.
- [x] Define failure behavior when a component has no matching tagged
  snapshot, including automation-run audit records and retry policy.
- [x] Add scheduler integration tests for both `cron` and `dates`, including
  successful execution, restart recovery, idempotency, component-resolution
  failure, and retry behavior.
- [x] Add operational documentation covering scheduler activation, UTC
  interpretation, observability, failures, and retries.

### Current implementation slice — Scheduled virtual materialization

- [x] Add a scheduler reconciliation task for persisted virtual-track
  `cron` and `dates` schedules while preserving explicit-only `manual` mode.
- [x] Persist schedule occurrences and claim them atomically so multiple
  scheduler instances cannot concurrently process the same occurrence.
- [x] Make snapshot persistence idempotent by recording the scheduled
  occurrence on the resulting virtual draft.
- [x] Recover missed `dates` occurrences and failed `cron` or `dates`
  occurrences during reconciliation.
- [x] Record every materialization attempt in the automation-run audit trail.
- [x] Add scheduler integration coverage for success, restart recovery,
  duplicate delivery, component failure, and retry.
- [x] Update OpenAPI, user/developer/operations documentation, frontend
  guidance, and Bruno.
- [x] Run focused scheduler tests, lint, and the complete `npm test` suite.
- [x] Review the final diff and propose conventional commit messages.

Verification result (2026-07-29):

- The focused scheduler integration spec passes (4), OpenAPI validation
  passes (2), and backend lint passes.
- The first complete run encountered five unrelated roaming failures after
  933 API tests passed. Each affected spec passed in isolation.
- The required clean `npm test` rerun passes (OpenAPI 2, config 21, API 938,
  middleware 24).
- Proposed REST API commit:

  ```text
  feat(release-tracks): schedule virtual snapshot materialization

  Execute persisted cron and date schedules through the existing virtual
  snapshot lifecycle. Add durable occurrence claims, restart-safe
  idempotency, automation-run auditing, retry behavior, scheduled snapshot
  provenance, and aligned API and operations documentation.
  ```

- Proposed companion Bruno commit:

  ```text
  docs(release-tracks): document scheduled materialization

  Describe UTC cron and date execution, restart recovery, idempotency,
  and retry behavior for virtual snapshot schedules.
  ```

### P2 — Contract decisions

- [x] Virtual tracks cannot compose virtual tracks. Components must be
  standard tracks; revisit nesting only if a concrete future use case requires
  it.
- [x] Do not implement the documented native-members/hybrid model. Virtual
  tracks are purely compositional; content that is not already represented
  belongs in a dedicated standard component track.
- [x] Do not implement `resolve=true` or `resolved_content`. Virtual
  composition is resolved eagerly into exact object revisions when a draft is
  materialized; retrieval must never re-resolve a persisted snapshot.
- [x] Do not implement caching or component-release notifications without
  measured scale or an approved operator workflow. Persisted snapshots already
  avoid composition recomputation, and no notification recipient, channel, or
  expected action has been defined.

### Current implementation slice — Deterministic virtual membership

- [x] Resolve the `latest` request shorthand to the actual latest
  `stix.modified` value before standard-track contents are persisted.
- [x] Defensively lock any unresolved component member to an exact revision
  during virtual materialization, while preserving exact revisions already
  frozen into tagged component snapshots.
- [x] Add regression coverage proving that component `track_latest` behavior
  cannot move a materialized virtual member and repeated snapshot retrieval
  returns the same exact revision set.
- [x] Remove `resolve=true` and `resolved_content` from the documented
  retrieval contract.
- [x] Clearly document that persisted primary member revisions are
  deterministic while bundle-time secondary-object and relationship
  expansion is not.
- [x] Update OpenAPI, frontend guidance, and Bruno where the clarified
  contract affects consumers.
- [x] Run focused tests, lint, OpenAPI validation, and the complete `npm test`
  suite.
- [x] Apply logic review, inspect the final diff, and propose conventional
  commit messages.

Verification result (2026-07-29):

- The dedicated virtual-determinism spec passes (2), and the combined
  determinism, release-track lifecycle, and virtual-domain regression group
  passes (4).
- OpenAPI validation passes (2), backend lint passes, and the complete
  `npm test` suite passes (OpenAPI 2, config 21, API 941, middleware 24).
- Logic review result: `ROBUST`. Request-time `latest` resolution, immutable
  tagged component pins, legacy unresolved-member locking, invalid-date
  rejection, and repeated-reference resolution were covered without finding a
  remaining correctness defect.
- Proposed commits:

  ```text
  fix(release-tracks): enforce pure virtual composition

  Require virtual components to be standard tracks and reject unsupported
  native-member input across the API contract and documentation.
  ```

  ```text
  fix(release-tracks): freeze virtual member revisions

  Resolve latest member shorthand before persistence, lock virtual composition
  to exact revisions, and document the bundle graph consistency boundary.
  ```

  ```text
  docs(release-tracks): clarify snapshot determinism

  Document exact virtual member pins and the bundle-time secondary-content
  consistency boundary in the Bruno collection.
  ```

### Future architecture — Deterministic bundle graphs

- [ ] Design version-controlled STIX Relationship Objects whose source and
  target references identify exact `(object_id, object_modified)` revisions
  rather than an entire STIX object provenance chain.
- [ ] Evaluate cloning every affected SRO when a new SDO revision is created,
  including atomicity, fan-out, concurrency, migration, and rollback behavior.
- [ ] Measure the resulting database-storage amplification and query/index
  costs before approving implementation.
- [ ] Define and persist an export manifest that pins every secondary object,
  supporting object, and relationship revision required to reproduce a bundle.
- [ ] Until that architecture is approved and implemented, preserve and
  prominently document the accepted constraint that `format=bundle` output is
  not graph- or byte-level deterministic.

### Current implementation slice — Pure standard-track composition

- [x] Make standard component tracks a positive service-layer requirement,
  preserving rejection during both virtual-track creation and composition
  replacement.
- [x] Reject unsupported top-level creation properties such as
  `native_members` instead of silently stripping them.
- [x] Add regression coverage for virtual-track nesting on both creation and
  composition update, and for attempted native-member creation.
- [x] Remove nesting and hybrid/native-member claims from OpenAPI, user and
  developer documentation, frontend guidance, and Bruno.
- [x] Run the focused virtual-composition spec, lint, and complete `npm test`
  suite.
- [x] Review the final diff and propose conventional commit messages.

Verification result (2026-07-29):

- The focused virtual-composition validation spec passes (6), OpenAPI
  validation passes (2), and backend lint passes.
- The first complete run encountered six unrelated roaming failures after
  910 API tests passed. All affected specs passed in isolation.
- The required clean `npm test` rerun passes in full, including OpenAPI,
  configuration, API, and middleware suites.
- Architecture review result: the positive standard-track allowlist and strict
  creation schema keep the contract explicit without adding a parallel
  composition path or new abstraction.
- Proposed REST API commit:

  ```text
  fix(release-tracks): enforce pure virtual composition

  Require every virtual component to be a standard track during creation and
  composition updates. Reject unsupported native-member input and align
  OpenAPI, documentation, frontend guidance, and regression coverage.
  ```

- Proposed companion Bruno commit:

  ```text
  docs(release-tracks): clarify pure virtual composition

  Document standard-only components, rejected virtual nesting, and the absence
  of native virtual members.
  ```

### Documentation corrections

- [ ] Replace `stix.type = "virtual"` with the top-level snapshot
  `type: "virtual"`.
- [ ] Remove the nonexistent snapshot-level `snapshot_id`; retain
  `version_history[].snapshot_id`.
- [ ] Correct response envelopes and the virtual-create response example.
- [ ] Align `composition_resolution` examples with fields actually generated,
  or implement the documented `by_type`, `by_tier`, and native statistics.
- [ ] Align documented error envelopes with centralized error-handler output.
- [x] Include required `priority` values in every composition example.
- [x] Clearly distinguish configured composition from a materialized draft and
  document scheduler activation, timing, recovery, and retry behavior.

### Verified complete

- [x] Composition changes invalidate inherited materialized contents and
  require explicit rematerialization before release.
- [x] Generic contents replacement rejects virtual tracks.
- [x] Exact-revision quarantine resolution is available at
  `POST /api/release-tracks/:id/virtual/quarantine/promote`.
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

### Current implementation slice — Strict composition contracts

- [x] Add API regression coverage for unknown composition/filter keys on both
  virtual-track creation and composition update.
- [x] Require the selector appropriate to each `resolution_strategy` and
  reject selectors that do not apply to that strategy.
- [x] Make the composition, component, filter, and deduplication request
  objects strict without changing persisted response shapes.
- [x] Update OpenAPI, user/developer documentation, and Bruno examples.
- [x] Run the focused regression spec, then lint and the complete `npm test`
  suite.
- [x] Review the final diff and propose a conventional commit message.

Verification result (2026-07-29):

- The focused virtual-composition contract spec passes (3), OpenAPI validation
  passes (2), and backend lint passes.
- The first complete run encountered one roaming 404 in the new spec after 917
  API tests passed. The spec passed both in isolation (3) and alongside its
  preceding snapshot-history spec (10).
- The required clean `npm test` rerun passes (OpenAPI 2, config 21, API 918,
  middleware 24).
- Proposed commit:

  ```text
  fix(release-tracks): validate virtual composition contracts

  Reject unknown composition properties and enforce strategy-specific
  component selectors across virtual-track creation and updates. Align
  OpenAPI, documentation, frontend guidance, and Bruno examples.
  ```

### Current implementation slice — Component identity and priority validation

- [x] Add creation and composition-update regression coverage for required
  priorities, duplicate priorities, and duplicate component track IDs.
- [x] Reject missing component tracks and virtual component tracks before an
  initial virtual track is persisted.
- [x] Make component priority required and non-negative across Zod, Mongoose,
  OpenAPI, user/developer documentation, and Bruno examples.
- [x] Keep service-layer component validation as a defense for non-HTTP
  callers while moving deterministic duplicates to request validation.
- [x] Run the focused regression specs, then lint and the complete `npm test`
  suite.
- [x] Review the final diff and propose a conventional commit message.

Verification result (2026-07-29):

- The focused release-track regression group passes (22), the isolated
  backrefs spec passes (23), OpenAPI validation passes (2), and backend lint
  passes.
- The first complete run encountered one unrelated shared-suite failure in the
  backrefs manual-sync case after 919 API tests passed. The affected spec
  passed in isolation (23).
- The required clean `npm test` rerun passes (OpenAPI 2, config 21, API 920,
  middleware 24).
- Proposed commit:

  ```text
  fix(release-tracks): validate virtual component identities

  Require unique component priorities and track IDs, validate referenced
  standard tracks before initial virtual-track persistence, and align request,
  persistence, OpenAPI, documentation, and frontend contracts.
  ```

- Proposed companion Bruno commit:

  ```text
  docs(release-tracks): document component priority constraints

  Document required unique priorities and standard component references for
  virtual-track creation and composition updates.
  ```

### Current implementation slice — Snapshot schedule contracts

- [x] Add creation regressions for valid and invalid `manual`, `cron`, and
  `dates` schedule payloads.
- [x] Enforce a strict mode-discriminated request contract:
  - `manual` accepts only `mode`;
  - `cron` requires `cron` and rejects `dates`;
  - `dates` requires at least one date and rejects `cron`.
- [x] Reject `snapshot_schedule` on standard-track creation instead of silently
  dropping it.
- [x] Repeat schedule invariants at the service and Mongoose boundaries for
  non-HTTP callers.
- [x] Align OpenAPI, user/developer documentation, frontend guidance, the
  `internalattack` test fixture, and Bruno.
- [x] Run focused regression specs, lint, and the complete `npm test` suite.
- [x] Review the final diff and propose conventional commit messages.

Verification result (2026-07-29):

- The focused schedule-contract spec passes (7), the focused virtual-track
  regression group passes (29), OpenAPI validation passes (2), and backend
  lint passes.
- The required complete `npm test` suite passes (OpenAPI 2, config 21, API
  927, middleware 24).
- The `internalattack` focused release-track suite passes (30), and its
  complete suite passes (247).
- Proposed REST API commit:

  ```text
  fix(release-tracks): validate virtual snapshot schedules

  Enforce strict mode-specific virtual snapshot schedules across request,
  service, persistence, OpenAPI, documentation, and frontend contracts.
  Reject schedule metadata for standard tracks.
  ```

- Proposed companion Bruno commit:

  ```text
  docs(release-tracks): document snapshot schedule modes

  Document the strict manual, cron, and dates schedule payloads and clarify
  that automated execution is not yet implemented.
  ```

- Proposed companion `internalattack` commit:

  ```text
  test(release-tracks): align virtual composition fixture

  Include the required component priority in virtual-track creation coverage.
  ```

### Current implementation slice — Object-type filter contracts

- [x] Define `filters.object_types` against the canonical Workbench STIX type
  vocabulary instead of accepting arbitrary strings.
- [x] Reject empty arrays, duplicate values, malformed values, and unsupported
  object types on both virtual-track creation and composition update.
- [x] Repeat the accepted-value constraint at the Mongoose persistence
  boundary.
- [x] Add direct materialization coverage proving that object-type filtering
  preserves the exact revision pinned by the tagged component snapshot rather
  than resolving the latest database revision.
- [x] Align OpenAPI, user/developer documentation, frontend guidance, and
  Bruno; verify whether `internalattack` needs a typed client change.
- [x] Run focused regression specs, lint, and the complete `npm test` suite.
- [x] Review the final diff and propose conventional commit messages.

Verification result (2026-07-29):

- The dedicated object-type contract and exact-revision materialization spec
  passes (5); the combined virtual composition, domain, schedule, and
  object-type filter group passes (18).
- OpenAPI validation passes (2), backend lint passes, and the required clean
  `npm test` run passes (OpenAPI 2, config 21, API 923, middleware 24).
- Earlier complete runs encountered unrelated shared-suite flakes in user
  account startup, analytics socket handling, and campaign/group HTTP
  handling. The affected specs pass in isolation (14, 12, and 44
  respectively).
- `internalattack` already accepts composition filters as a mapping, so this
  contract clarification does not require a typed client change.
- Proposed REST API commit:

  ```text
  fix(release-tracks): validate virtual object type filters

  Constrain virtual component object-type filters to the canonical Workbench
  STIX vocabulary across request, service, persistence, OpenAPI, and
  documentation boundaries. Preserve exact component snapshot revisions.
  ```

- Proposed Bruno commit:

  ```text
  docs(release-tracks): document object type filters

  Document canonical virtual component object-type values, omission semantics,
  and exact-revision behavior.
  ```

### Current implementation slice — Deterministic virtual deduplication

- [x] Add materialization regressions for all four deduplication strategies
  using both an exact revision shared by multiple components and genuinely
  different revisions of the same STIX object.
- [x] Collapse repeated contributions of the same `(object_ref,
  object_modified)` revision before applying conflict resolution.
- [x] Count an object contributed by multiple components once in
  `duplicates_found`, but include it in `conflicts_resolved` only when multiple
  distinct revisions remain after exact-revision collapse.
- [x] Choose one deterministic source component for every surviving revision:
  use the active strategy's ordering and use component priority as the stable
  tie-breaker.
- [x] Quarantine one entry per distinct conflicting revision and leave an
  identical revision shared by multiple components in `members`.
- [x] Derive `objects_contributed` from explicit survivor attribution so its
  component total equals `summary.total_objects`.
- [x] Align OpenAPI, user/developer documentation, frontend guidance, Bruno,
  and `internalattack` if the clarified response semantics require downstream
  changes.
- [x] Run focused regression specs, lint, and the complete `npm test` suite.
- [x] Review the final diff and propose conventional commit messages.

Verification result (2026-07-29):

- The dedicated four-strategy deduplication spec passes (4); the combined
  deduplication, quarantine, and back-reference release-track group passes
  (29).
- OpenAPI validation passes (2), backend lint passes, and the required clean
  `npm test` run passes (OpenAPI 2, config 21, API 936, middleware 24).
- An earlier complete run encountered unrelated shared-suite 404, 400, and
  connection-reset failures in Recent Activity, References, and Ephemeral
  Bundle tests. Those three specs pass together in isolation (30).
- `internalattack` exposes the resolution response as an untyped mapping, so
  the clarified metric semantics do not require a Python client change.
- Performance review result: `PERFORMANT`. The implementation replaces the
  prior input-to-output nested survivor scan with linear source attribution;
  no database, blocking, or resource-management regression was found.
- Proposed REST API commit:

  ```text
  fix(release-tracks): deduplicate virtual revisions deterministically

  Collapse exact component revision duplicates before resolving conflicts,
  attribute every surviving member to one deterministic source, and quarantine
  only genuinely different revisions.
  ```

- Proposed Bruno commit:

  ```text
  docs(release-tracks): clarify virtual deduplication

  Document exact-revision collapse, genuine conflict handling, and deterministic
  component contribution accounting.
  ```

### Current implementation slice — Virtual release provenance

- [x] Add release preview and commit regressions proving that virtual
  `version_history[].component_versions` comes from the selected draft's
  immutable `composition_resolution`, even if a component is released again
  before the virtual draft is tagged.
- [x] Define `component_versions` as an optional object keyed by immutable
  component track ID with tagged `MAJOR.MINOR` version values.
- [x] Populate provenance only for virtual release history entries and leave
  standard release history unchanged.
- [x] Enforce the provenance value shape at the Mongoose persistence boundary
  and describe it in OpenAPI.
- [x] Align user/developer documentation, frontend guidance, Bruno, and
  `internalattack` if the response contract requires downstream changes.
- [x] Run focused regression specs, lint, and the complete `npm test` suite.
- [x] Apply logic and performance review checklists, inspect the final diff,
  and propose conventional commit messages.

Verification result (2026-07-29):

- The focused release-planning and commit spec passes (16), including
  workbench preview, in-place release persistence, standard-track omission,
  immutable component advancement, and invalid Mongoose key/value cases.
- OpenAPI validation passes (2), backend lint passes, and the required clean
  `npm test` run passes (OpenAPI 2, config 21, API 938, middleware 24).
- An earlier complete run encountered unrelated roaming 404s in Attack Objects
  pagination and References after 936 API tests passed. The affected specs pass
  together in isolation (30).
- `internalattack` returns release preview and commit responses as raw mappings,
  so the additive history field requires no Python client change.
- Logic review result: `ROBUST`. Preview and commit both derive provenance from
  the selected persisted draft, malformed map keys/values are rejected, and
  standard release history remains unchanged.
- Performance review result: `PERFORMANT`. Provenance construction is a linear
  in-memory pass over already-loaded component resolution metadata and adds no
  database reads, blocking work, or resource lifecycle.
- Proposed REST API commit:

  ```text
  fix(release-tracks): record virtual release provenance

  Persist immutable component track versions from the materialized virtual
  draft in release history, validate the provenance map, and align API,
  documentation, frontend, and regression contracts.
  ```

- Proposed Bruno commit:

  ```text
  docs(release-tracks): document virtual release provenance

  Describe the track-ID-keyed component version map returned by virtual release
  previews and commits.
  ```

### Tracker consolidation

- [x] Consolidate the virtual-track completion backlog into this section.
- [x] Preserve completed implementation evidence in the dated records below.
- [x] Move the downstream Angular handoff to
  `docs/developer/FRONTEND_TODO.md`.
- [x] Remove the superseded root-level tracker files.

## Document downstream frontend work

- [x] Inventory the current release-track API contract and recent endpoint,
  terminology, lifecycle, validation, and response-shape changes.
- [x] Inspect the Angular release-track consumers so the handoff identifies
  concrete downstream work instead of restating backend implementation notes.
- [x] Create `docs/developer/FRONTEND_TODO.md` with task-oriented guidance,
  contextual explanations, and acceptance criteria.
- [x] Cross-check the handoff against OpenAPI, user/developer documentation,
  Bruno, and the `internalattack` client.
- [x] Review formatting and the final diff.

Verification result (2026-07-29):

- The handoff was cross-checked against the current OpenAPI paths, release-track
  documentation, Bruno requests, `internalattack` methods, and Angular
  release-track consumers.
- `git diff --check` passes.
- Proposed commit:

  ```text
  docs(release-tracks): track required frontend updates

  Document the route, request, response, lifecycle, and terminology changes
  that the Angular release-track client must adopt.
  ```

## Implement virtual quarantine resolution

- [x] Add end-to-end regression coverage for exact-revision quarantine
  promotion, snapshot immutability, back-reference reconciliation, validation,
  and virtual-track type enforcement.
- [x] Add `POST /api/release-tracks/:id/virtual/quarantine/promote`.
- [x] Promote the selected revision to members in a new draft and remove all
  quarantined alternatives for the same object.
- [x] Preserve the immutable composition-resolution record and historical
  materialized snapshot.
- [x] Update OpenAPI, user/developer documentation, and Bruno.
- [x] Run focused regression specs, then lint and the complete `npm test` suite.
- [x] Review the final diff and propose a conventional commit message.

Verification result (2026-07-29):

- Focused quarantine, release, back-reference, and virtual-domain specs pass
  (40); backend lint passes.
- The first complete run encountered six unrelated shared-suite failures in
  collection bundles, data-component pagination, and user accounts. All three
  specs passed in isolation (30, 13, and 14 tests respectively).
- The required clean `npm test` rerun passes (OpenAPI 2, config 21, API 915,
  middleware 24).
- The `internalattack` focused release-track suite passes (30), its complete
  suite passes (247), and changed-file Ruff and pre-commit checks pass.
- Proposed commit:

  ```text
  feat(release-tracks): resolve virtual quarantine conflicts

  Add an explicitly virtual-scoped endpoint for selecting an exact
  quarantined revision into a new draft. Preserve materialization provenance,
  reconcile back-references, and update supported clients and documentation.
  ```

## Harden virtual materialization lifecycle

- [x] Record the complete virtual-track audit in the dedicated virtual release
  tracks section of this file.
- [x] Add regression coverage for stale composition state, unmaterialized
  release attempts, and virtual use of standard contents endpoints.
- [x] Clear inherited materialized state when virtual composition changes.
- [x] Require a materialized virtual draft for release preview and commit.
- [x] Restrict generic contents replacement to standard tracks.
- [x] Update OpenAPI, user/developer documentation, and Bruno.
- [x] Run focused regression specs, then the complete `npm test` suite.
- [x] Review the final diff and propose a conventional commit message.

Verification result (2026-07-29):

- Focused release, back-reference, release-by-object, and virtual-domain specs
  pass (46); backend lint passes.
- The complete suite passes (OpenAPI 2, config 21, API 913, middleware 24).
- Proposed commit:

  ```text
  fix(release-tracks): enforce virtual materialization lifecycle

  Invalidate materialized contents when composition changes and reject release
  planning until the virtual draft is rematerialized. Restrict direct contents
  replacement to standard tracks and document the remaining virtual-track work.
  ```

## Consolidate virtual draft creation and shared release previews

- [x] Move virtual-only composition and draft-creation operations under an
  explicit `/virtual` capability namespace.
- [x] Remove the standalone virtual snapshot-preview endpoint without an
  alias.
- [x] Enhance shared virtual release summaries to compare the persisted draft
  with its preceding tagged release without recomputing composition.
- [x] Add regression coverage for route removal, type enforcement, latest and
  historical virtual previews, and release-preview non-persistence.
- [x] Update OpenAPI, user/developer documentation, Bruno, and the
  `internalattack` Python client.
- [x] Run focused regression specs, then the complete `npm test` suite.
- [x] Review the final diff and propose a conventional commit message.

Verification result (2026-07-29):

- Focused release, back-reference, release-by-object, and virtual-domain specs
  pass; backend lint passes.
- The first complete run encountered two unrelated full-suite flakes in Assets
  and Campaigns; both passed in isolation. The required second complete
  `npm test` run passed.
- The `internalattack` focused suite passes (29), its complete suite passes
  (246), and changed-file Ruff and pre-commit checks pass.
- Proposed commit:
  `feat(release-tracks): clarify virtual draft and release lifecycle`

## Bootstrap faster-release core, defense, and virtual tracks

- [x] Reconcile the clarified ownership partition with the current release-track
  and virtual-composition API.
- [x] Add regression coverage for functional virtual domain filters and
  relationship-complete snapshot bundle exports.
- [x] Implement virtual `filters.domains` using the established ATT&CK domain
  inference rules.
- [x] Reuse/extract existing bundle relationship logic so snapshot
  `format=bundle` exports dynamically include valid secondary relationships.
- [x] Inventory and report any additional release-track no-op placeholders.
- [x] Update user/developer docs and OpenAPI for the effective contract change;
  Bruno has no new or changed request parameter to mirror.
- [x] Run focused release-track regression specs, then the complete `npm test`
  suite.
- [x] Scan all three ATT&CK v19.1 bundles and construct a disjoint exact-revision
  partition for Enterprise Core, ICS Core, Mobile Core, and Defense.
- [x] Assign the shared identity and marking definitions to Enterprise Core
  using the representations supported by release-track snapshots.
- [x] Preflight exact track names and refuse conflicting duplicate tracks.
- [x] Create and verify the four v19.1-pinned standard tracks.
- [x] Create and verify the three domain-filtered virtual track definitions.
- [x] Verify that every in-scope v19.1 object is owned by exactly one standard
  track and record intentional relationship/collection exclusions. CTI owns
  `course-of-action`; ICS Core owns `x-mitre-asset`.
- [x] Defer materializing virtual snapshots until the component standard tracks
  have tagged releases; no release/tag action was authorized in this bootstrap.
- [x] Review the final repository diff and propose a conventional commit
  message.

Operational result (2026-07-28):

- Standard tracks: Enterprise Core
  (`release-track--48be5319-2f98-435a-ba36-5533236a991a`, 875 members),
  ICS Core (`release-track--73147f31-2598-42a3-9cb4-125d458c4490`, 149),
  Mobile Core (`release-track--ae6df6f6-3856-4d54-af40-22db856baa2d`, 206),
  Defense (`release-track--84cb1147-9dba-445f-948e-6eecc51fa7e8`, 3,151),
  and CTI (`release-track--469b126a-6081-462e-8b4c-709cdbb4eac4`, 1,575).
- CTI now includes 60 campaigns, 358 courses of action, 194 intrusion sets,
  866 malware objects, and 97 tools, pinned to the latest database revisions.
- Virtual definitions: Enterprise
  (`release-track--a42a6f32-80c6-43a7-b1e7-26ef0814d0cb`), ICS
  (`release-track--83ede842-58c8-42ce-a3fb-c38c5dd0e74c`), and Mobile
  (`release-track--05615c60-bca8-4074-b8d3-b537eed52d30`). Each composes all
  five standard tracks with `latest_tagged`, `prioritize_latest_object`, and
  its domain filter.
- Verified 5,928 unique v19.1 owned object IDs form a disjoint partition;
  relationships remain indirect, collections are generated at export, and
  marking definitions are supporting metadata.
- Focused domain-filter and bundle-export specs pass (1 and 15 tests);
  lint passes; the complete suite passes (OpenAPI 2, config 21, API 909,
  middleware 24).
- Proposed commit:
  `feat(release-tracks): filter virtual tracks and export relationships`

## Bootstrap CTI faster-release tracks

- [x] Read the local environment mapping and release-track documentation.
- [x] Inspect the internalattack release-track client and reference script.
- [x] Scan the ATT&CK v19.1 ICS and Mobile bundles and report every object type.
- [x] Preflight the production-mirroring Workbench API and existing tracks.
- [x] Create the CTI standard track with the latest intrusion-set, malware,
  tool, and campaign revisions as members.
- [x] Verify the persisted CTI snapshot, object-type coverage, exact latest
  revision pins, and counts.
- [x] Record operational results and propose a conventional commit message for
  the committable scratchpad update.

Operational result (2026-07-28):

- Created standard track `CTI`
  (`release-track--469b126a-6081-462e-8b4c-709cdbb4eac4`).
- Initially pinned 1,217 exact latest revisions as members: 60 campaigns, 194
  intrusion sets, 866 malware objects, and 97 tools. The clarified ownership
  bootstrap subsequently added 358 courses of action for 1,575 total members.
- Verified the persisted snapshot, registry count, and all 1,575 member
  backrefs; candidates and staged are empty.
- Proposed commit: `docs(release-tracks): record CTI bootstrap run`

## Harden release version selection

- [x] Reject simultaneous `increment` and `version` selectors inside the
  release planner, even when controller validation is bypassed.
- [x] Add regression coverage for planner-level mutual exclusivity.
- [x] Make exact, incremental, default, and ambiguous selection behavior
  explicit in OpenAPI, user/developer docs, and Bruno.
- [x] Run the focused release-track spec, lint, and complete `npm test` suite.
  The focused release spec passes (10 tests), lint passes, and the complete
  backend suite passes (OpenAPI: 2, config: 21, API: 907, middleware: 24).
  Targeted frontend Prettier and ESLint pass; TypeScript remains blocked by
  the checkout's existing Angular dependency-resolution and unrelated type
  errors.
- [x] Review the final diff and propose a conventional commit message.

## Release command and unified previews

- [x] Replace bump routes and symbols with explicit release operations for
  latest and historical snapshots.
- [x] Implement one pure release planner shared by summary, workbench, bundle,
  and commit paths.
- [x] Remove `dry_run`, rename version `type` to `increment`, and reject
  conflicting version-selection inputs.
- [x] Keep release targeting semantics explicit: `latest` resolves at request
  time, while `:modified` pins a specific snapshot; no client precondition is
  required.
- [x] Add regression coverage for preview parity, non-persistence, conflicts,
  formats, validation, historical releases, and removed bump routes.
- [x] Update OpenAPI, user/developer documentation, Bruno, and frontend
  consumers.
- [x] Run focused tests and frontend checks, then the complete `npm test`
  backend suite.
  Focused release-track suites pass (49 tests), and the affected backref suite
  passes again in isolation (23 tests). The complete backend suite passes on
  retry. Targeted frontend formatting and ESLint pass; frontend Vitest and
  TypeScript startup remain blocked by the checkout's existing
  ESM/dependency-resolution errors.
- [x] Review the final diff and propose a conventional commit message.

## Remove implicit latest-snapshot route

- [x] Remove `GET /api/release-tracks/:id` while preserving track deletion.
- [x] Make `/snapshots/latest` canonical across OpenAPI, tests, docs, Bruno,
  and the frontend consumer.
- [x] Add regression coverage proving the removed method returns 405.
- [x] Run focused regression specs followed by the complete `npm test` suite.
  The focused suites pass. The aggregate run reached 894 passing with three
  unrelated documented roaming failures; all three affected specs pass
  together in isolation (51 passing).
- [x] Review the final diff and propose a conventional commit message.

## Snapshot history collection endpoint

- [x] Add `GET /api/release-tracks/:id/snapshots` with strict tagged filtering
  and pagination, plus an explicit `/snapshots/latest` alias.
- [x] Return lightweight, type-oriented summaries: standard snapshots include
  member/staged/candidate counts; virtual snapshots include member/quarantine
  counts.
- [x] Add regression coverage for defaults, filters, pagination, validation,
  track types, and not-found behavior.
- [x] Update OpenAPI, user/developer documentation, and Bruno requests.
- [x] Run the focused regression spec followed by the complete `npm test`
  suite.
- [x] Review the final diff and propose a conventional commit message.

## Regression Tests

- [ ] Implement regression tests

- [x] **Investigate the recurring full-suite flake.** Two root causes found and fixed (2026-07-10) in `app/lib/database-in-memory.js`:
  1. *Port collision*: every spec file stopped and restarted the `mongodb-memory-server` instance, and a fresh mongod would intermittently fail with `Port already in use` — breaking that file's `before` hook (surfacing as `loginAnonymous` 404s) and cascading failures through the file. Fixed by reusing one mongod for all spec files in the process (`closeConnection` drops the database and disconnects but keeps the server running) plus `--exit` on the mocha scripts.
  2. *Vanishing unique indexes*: dropping the database between spec files also drops its indexes, and mongoose's per-model `init()` is memoized per process — so the `stix.id + stix.modified` unique index was intermittently missing for later files, letting duplicate-POST tests (and dependent count tests) fail in roaming pairs. Fixed by explicitly awaiting `createIndexes()` for all registered models after each reconnect.

  Residual: rare (≈1 per run under heavy machine load) single-test failures of a different character (a count assertion, a 20s timeout in a pagination GET) still appear occasionally and pass in isolation — likely load-related; keep observing before chasing further.

## Release-track cross-tier revision uniqueness

- [x] Read the release-track user and developer documentation and identify the
  intended exact-revision invariant.
- [x] Trace every standard/virtual tier ingress and transition path.
- [x] Add regression coverage proving one `(stix.id, stix.modified)` revision
  cannot occupy multiple tiers while different revisions of one ID can.
- [x] Enforce the invariant for candidate adds, promotions, demotions, bulk
  status transitions, release bumps, member sync, and quarantine workflows.
- [x] Update user/developer documentation (and OpenAPI/Bruno only if the API
  contract changes).
- [x] Run focused specs and the complete `npm test` suite. The task-specific
  and constituent suites pass; repeated aggregate runs each encountered one
  unrelated roaming API failure that passed immediately in isolation.
- [x] Review the final diff and propose a conventional commit message.


## Snapshot Output Format

**TASK Summary**: Implement support for the `bundle` output format for snapshots

`bundle` refers to a STIX 2.1 bundle that contains all of the objects in the snapshot. The bundle should be emitted as a JSON object with the following structure:

```json
{
  "type": "bundle",
  "id": "bundle--<UUID>",
  "spec_version": "2.0", // omit if STIX 2.1, include for STIX 2.0
  "objects": [
    // All objects in the snapshot
  ]
}
```

The following release-track snapshot retrieval endpoints support `include` and
`format` query parameters:

- `GET /api/release-tracks/:id/snapshots/latest` (get latest snapshot)
- `GET /api/release-tracks/:id/snapshots/:modified` (get specific snapshot)

> [!Note]
> The ephemeral bundle endpoint (`GET /api/release-tracks/ephemeral/{domain}`) supports `format`, but not tier `include`, because it does not read from a persisted release-track snapshot. Rather, it "blindly" includes all objects in the domain.


**Include Parameter** (controls which tiers are returned):
```
GET /api/release-tracks/:id/snapshots/latest                            # Default: all tiers
GET /api/release-tracks/:id/snapshots/latest?include=members            # Members tier only
GET /api/release-tracks/:id/snapshots/latest?include=staged             # Members and staged tiers
GET /api/release-tracks/:id/snapshots/latest?include=candidates         # Members and candidates tiers
GET /api/release-tracks/:id/snapshots/latest?include=quarantine         # Members and quarantine tiers
GET /api/release-tracks/:id/snapshots/latest?include=all                # All tiers
```

**Format Parameter** (controls output format):
```
GET /api/release-tracks/:id/snapshots/latest?format=workbench           # Workbench snapshot with metadata (default)
GET /api/release-tracks/:id/snapshots/latest?format=bundle              # Standard STIX 2.1 bundle
GET /api/release-tracks/:id/snapshots/latest?format=filesystemstore     # Not implemented; returns 501
```

**Combined Example:**
```
GET /api/release-tracks/:id/snapshots/latest?include=all&format=workbench
```

> [!Note]
> The `workbench` format is the default output format and is already implemented. The `bundle` format is a new output format that needs to be implemented. The `filesystemstore` format is not implemented and will return a 501 error if requested.

### Replacing the legacy `GET /api/stix-bundles` endpoint

Importantly, the release track retrieval method with `format=bundle` as well as the ephemeral bundle endpoint will supplant the `GET /api/stix-bundles/` endpoint defined in `stix-bundles-routes.js`. The `stix-bundles` endpoint will be deprecated and removed in a future release. We thus need to inspect the `stix-bundles-controller.js` module and identify any logic that needs to be preserved with respect to preserving existing functionality in the new endpoints.

The `stix-bundles` endpoint currently supports generating a `x-mitre-collection` object that is emitted in the bundle. We need to ensure that this functionality is preserved in the new endpoints. Users specify how the `x-mitre-collection` object is generated via the `includeCollectionObject`, `collectionObjectVersion`, `collectionObjectModified`, and `collectionAttackSpecVersion` query parameters. We can simplify this functionality in the new endpoints:

- `collectionObjectVersion` can just default to `v0.1` to signify that the collection was generated ephemerally and is not connected to a particular release track.
- `collectionObjectModified` can default to the current timestamp.
- `collectionAttackSpecVersion` can default to the global default attack spec version (tracked in `config.js` and exposed via `app.attackSpecVersion`).
- The `includeCollectionObject` parameter can be renamed to `includeToc` to signify that the user wants to include a table of contents object in the bundle (which is what the `x-mitre-collection` object effectively is; moreover, the term, "collection", is oversaturated in the context of STIX and Workbench, so this renaming will help reduce confusion). The `includeToc` parameter can default to `true`.

Here is how each of the other query parameters should be handled/mapped to the newer ephemeral bundle retrieval endpoint (`/api/release-tracks/ephemeral/{domain}`):

- `includeNotes` can be **removed**. We originally implemented notes in Workbench such that they could be included in emitted STIX bundles because we treat notes as STIX objects. However, this concept never really took off, and we have decided to treat notes as second-class Workbench-native objects that are not STIX objects, and thus cannot be included in emitted STIX bundles.
- `includeMissingAttackId` should be **preserved** as `includeObjectsWithMissingAttackId`. This parameter allows users to control whether or not objects without ATT&CK IDs are included in the emitted bundle. It defaults to `false`.
- `stixVersion` should be **preserved**. This parameter allows users to control which STIX version is used in the emitted bundle (`2.0` or `2.1`). It defaults to `2.1`.
- `useLegacyMethod` should be **removed**. The `stix-bundles-service.js` module has a legacy method for generating STIX bundles that we no longer use. The new endpoints should not support this legacy method, and thus this parameter can be removed.
- `includeDataSources` should be **removed**. For context, Data Sources are officially considered a deprecated concept in ATT&CK as of ATT&CK Spec v3.3.0. They were marked as either deprecated or revoked in the corresponding ATT&CK content release (v18.0). Because we already have `includeDeprecated` and `includeRevoked` query parameters, we can remove `includeDataSources` and instead rely on the `includeDeprecated` and `includeRevoked` query parameters to control whether or not deprecated/revoked Data Sources are included in the emitted bundle. This will simplify the API and reduce confusion.
- `state` can be **removed**. The `state` parameter was originally implemented to allow users to control which objects are included based on their workflow status (`work-in-progress`, `awaiting-review`, `reviewed`). Before the introduction of release tracks, workflow status was globally scoped. Now, with release tracks, workflow status is scoped to a release track. The ephemeral bundle endpoint is domain scoped, not release-track scoped, and thus it does not have a concept of workflow status. The `state` parameter can be removed from the new endpoints.

### Updates to the release-track retrieval endpoints

For release track retrieval requests that include the `format=bundle` query parameter, the following query parameters must be supported:

- `include: ['candidate', 'staged']`: If specified, the value must be equal to an array of at least one value. The parameter acts as a filter, allowing users to specify whether release-track candidates and/or staged objects should be included in the bundle. If the `include` parameter is omitted, only members should be included.
- `state: ['work-in-progress', 'awaiting-review']`: If specified, the value must be equal to an array of at least one value. Notably, objects marked as `"reviewed"` are always included (by nature of all members being included —— all members are inherently "reviewed"), irrespective of this query parameter. The parameter acts as a union filter that logically combines with `include`. In other words, when `include` and `state` are both specified, `include` is applied first, then `state` is applied to the remaining `include`-filtered subset. (i.e., Of the candidates and/or staged objects that are ready to be included in the emitted bundle, only include the ones that are marked as "work-in-progress", "awaiting-review", or either). 
- `stixVersion` should be **preserved**. This parameter allows users to control which STIX version is used in the emitted bundle (`2.0` or `2.1`). It defaults to `2.1`.

### Fixing the /bump/preview endpoint

Currently there exists support for the `format` query parameter on the `GET /api/release-tracks/:id/bump/preview` endpoint. It's not actually functional (has no impact on the response body) and should be removed.

### In Summary:

- [x] Read the existing release track user + developer documentation in `docs/user/release-tracks/` and `docs/developer/release-tracks/`, respectively.
- [x] Review the new `GET /api/release-tracks/ephemeral/:domain` endpoint implementation as well as the legacy `GET /api/stix-bundles` endpoint.
- [x] Implement support for the `format=bundle` query parameter in the following two endpoints:
  - `GET /api/release-tracks/:id/snapshots/latest` (get latest snapshot)
  - `GET /api/release-tracks/:id/snapshots/:modified` (get specific snapshot)
- [x] Ensure that all required logic (query parameters) is/are implemented in the new endpoints as outlined above.
- [x] Implement regression tests for the new functionality (`release-tracks-bundle.spec.js`, `ephemeral-bundle.spec.js`)
- [x] Update the aforementioned user + developer documentation. The user documentation should simply describe how the behavior _is_ while the developer documentation should described _why_ and _how_, and additionally cover what has been described here: explaining what _was_ and how the functionality has evolved from before the introduction of release tracks to after. (See `docs/developer/release-tracks/bundle-export.md`.)
- [] Remove support for the `query` parameter on the `GET /api/release-tracks/:id/bump/preview` endpoint

## Bidirectional References

- [x] Implement bidirectional refs between objects and snapshots. Users should be able to get individual objects via standard getters (e.g., `GET /api/techniques/:id`) and see which snapshots they are part of in the object's metadata.

> **Implemented** as `workspace.release_tracks` (`[{ id, tier, status }]`, tiers `members`/`staged`/`candidates`/`quarantine` — matching the snapshot tier array names; the sketch below predates the rename of `phase` → `tier`), maintained via snapshot-driven reconciliation over the `release-track::contents-changed` EventBus event. See `docs/developer/release-tracks/backref-reconciliation.md` (why/how) and `docs/user/release-tracks/object-backrefs.md` (behavior). Regression tests: `app/tests/api/release-tracks/release-tracks-backrefs.spec.js`.

Currently, it is impossible to delineate which release tracks (if any) an object belongs to _from the object's perspective_. By "the object's perspective", I mean from a given STIX object document in the `attackObjects` Mongo collection —— you cannot look at a document in the `attackObjects` collection and see which release track(s) the object is a part of. Instead, you must scan all existing release tracks for the object's `stix.id` value in either the `candidates`, `staged`, `members`, or `quarantine` list.

This is easily correctable. When an object is either added or removed from a release track, the object document should be updated. We just need to include a small piece of metadata in the STIX object's document. Fortunately, we already have a pattern in place for tracking metadata: `workspace`. Moreover, we actually have an equivalent bidirectional ref tracker in place for the release tracks' predecessor: Workbench collections. They are/were tracked in each object's `workspace.collection` field. So, we may be able to copy/mimic this existing workflow.

I am imagining STIX object documents containing backwards pointers to their containing release track(s) looking something like this:

```yaml
# A Technique document
workspace:
    release_tracks:
        - id: String
          phase: String; Options: ['candidate', 'staged', 'member']
          status: String; Options: ['work-in-progress', 'awaiting-review', or 'reviewed']
stix: # ...
```

For example:

```yaml
workspace:
    release_tracks:
        - id: 'release-track--3a0e2537-1153-4b16-8ff5-1993f2d9cd7d'
          phase: 'candidate'
          status: 'work-in-progress'
stix: # ...
```

The `phase` and `status` fields will need to change for the appropriate `release_tracks` list element when user moves the object between the candidate, staged, and member phases; and when the object's status changes. We can make use of the event bus architecture here, following the same pattern that some services (like `detection-strategies-service.js` and `analytics-service.js`) use to track embedded relationships between two objects. Similarly, the release tracks service would just need to fire off an event that each of the STIX services listen; and when heard, they set the `workspace.release_tracks` field for the relevant STIX object document(s) accordingly.

## Release-Track Change Capture (in-place mutation hardening)

Object CRUD paths can mutate or destroy revisions that release tracks pin, without the track ever hearing about it. Design decisions locked in 2026-07-10. The `workspace.release_tracks` backrefs make every guard below a cheap document-local check (no track scanning).

- [x] **Reject revision re-keying on PUT.** `updateFull` merged body `stix.id`/`stix.modified` over the stored document, so a PUT could silently re-key a revision and strand any track pins. Now returns 400 when the body identity fields differ from the path parameters. Re-keying must go through POST (a new revision), which member sync captures. Tests: `app/tests/api/base-services/update-identity-guard.spec.js`.

- [x] **Capture in-place PUTs of pinned revisions.** Implemented 2026-07-13: `BaseService.updateFull` rejects (409, `MemberPinnedRevisionError`) when the revision is pinned in any track's `members` tier — released content is immutable in place; POST a new revision instead. `staged`/`candidates`-pinned revisions ride the `::updated` → revision-sync path and are marked with the server-assigned **`modified-in-place`** status (content changed with no revision history to diff — reviewers are told *that* something changed, not *what*; the marker is cleared via the review endpoint). Placement is centralized in the **workflow gate** (`app/lib/release-tracks/workflow-gate.js`): tier is decided against `candidacy_threshold`/`auto_promote` (`modified-in-place` ranks with `work-in-progress`), so permissive tracks keep in-place-edited staged entries staged while strict tracks demote them for re-review — and threshold-qualifying placements land directly in `staged` in a single snapshot (no more candidates bounce). Covers in-place deprecation (`x_mitre_deprecated` via PUT). The member-sync misfire (same-key duplicate cross-tier enrollment) is fixed by skipping enrollment of already-pinned revisions and skipping no-op snapshot clones. Future: an in-document changelog of in-place modifications would let the marker say *what* changed. Tests: `app/tests/api/release-tracks/release-tracks-change-capture.spec.js`.

- [x] **DELETE of tracked objects.** Implemented 2026-07-13 with a simplified decision: DELETE (single version or all versions) is *rejected* (409) when a revision is `members`-pinned, with guidance to retire the object via a new `x_mitre_deprecated` revision instead — members-pinned revisions are immutable and must never be deleted. (The earlier auto-convert-to-deprecation idea was dropped in favor of explicit rejection.) `candidates`/`staged`-pinned deletes remain allowed (the reconciler self-heals the dangling pin). Note: `CollectionsService` overrides `deleteVersionById`, so collections are not covered by the guard. Legacy delete controllers were migrated to the service-exception middleware (`next(err)`) so the 409 maps correctly.

- [x] **Revoke must reach member sync.** Implemented 2026-07-13: member sync subscribes to the 11 per-type `::revoked` events via a payload adapter (`handleStixObjectRevokedEvent`), so the revoked revision (`revoked: true`) is enrolled as a candidate in member tracks and candidate/staged pins move to it — treated exactly like any new revision. The revoke response's primary document carries the resulting backrefs. As decided, member sync is NOT extended to relationships: the revoked-by SRO and deprecation clones are pulled in dynamically at bundle export.

- [x] **Technique conversion should reach revision sync.** Implemented 2026-07-13 with the adapter approach (same pattern as `handleStixObjectRevokedEvent`): the `TECHNIQUE_CONVERTED_TO_SUBTECHNIQUE` / `SUBTECHNIQUE_CONVERTED_TO_TECHNIQUE` event payloads now carry the converted revision (`document`) and acting user, and member sync subscribes via `handleStixObjectConvertedEvent`, treating the conversion as a `new-revision` trigger through the workflow gate — candidate/staged pins move to the converted revision, member tracks enroll it as a candidate. The conversion responses refresh `workspace.release_tracks` after event processing (read-your-own-writes). Tests: conversion cases in `release-tracks-change-capture.spec.js` and the updated clone-strip test in `release-tracks-backrefs.spec.js`.

## Get Releases By Object

- [X] Implement `GET /api/release-tracks/objects/:objectRef/releases` so a
  caller can retrieve every tagged snapshot whose `members` tier directly
  contains the supplied STIX ID, across all object revisions and release
  tracks.

### Design

The existing `workspace.release_tracks` backrefs cannot answer this query:
they intentionally describe only each track's latest snapshot. A release that
historically contained an object must still be returned after a later snapshot
removes it. Conversely, copying all tagged snapshots into a new global MongoDB
collection would duplicate the existing per-track source data and undermine
the collection-per-track storage boundary.

Use `releaseTrackRegistry` as a compact global forward catalogue instead. Its
single document per track gains a server-maintained `tagged_releases` array:

```javascript
tagged_releases: [{
  snapshot_modified: Date, // (track_id, snapshot_modified) identifies the snapshot
  version: String,
  tagged_at: Date,
  tagged_by: String
}]
```

`tagged_release_count` is derived from `tagged_releases.length`. The actual
snapshot — including the authoritative `members` pins — remains in the track's
dynamic collection. Tagging reconciles this registry projection from the
source snapshots rather than incrementally appending, so retries and
retroactive tagging are idempotent and self-healing. A migration backfills
existing tracks.

The endpoint is stateless but necessarily fan-outs: read registry documents
with tagged releases, then issue one bounded-concurrency query per eligible
track using all of that track's tagged `snapshot_modified` values. Flatten,
sort deterministically, and paginate the matches. Registry references reduce
the search to tagged snapshots, but they are a forward index (track → release),
not an inverted object → release index; eliminating the per-track fan-out would
require a separate denormalized membership index and is deliberately out of
scope.

Add a partial multikey index to every dynamic track collection for
`members.object_ref`, limited to snapshots whose `version` is a string. Drafts
therefore incur no index cost, and draft squashing does not affect the lookup.

### Semantics

- Match the STIX ID across all revisions; return the pinned `object_modified`
  for each release.
- Include standard and virtual tracks by default; optional `type` filtering.
- Include only direct `members` entries from tagged snapshots. Do not include
  candidates, staged/quarantined entries, or secondary objects added during
  bundle export.
- Support `order=asc|desc` by `snapshot_modified`, plus `limit` and `offset`.
- Return 200 with an empty result for a valid STIX ID with no tagged releases;
  malformed IDs return 400.
- Ascending order describes first *published/tagged* appearance, not the time
  the object first entered an untagged draft.

### Checklist

- [x] Registry schema/repository: add `tagged_releases`, reconciliation, and
  derived count/latest-version maintenance.
- [x] Dynamic snapshot schema/repository: add the tagged-member partial index
  and a projected `findTaggedSnapshotsContainingObject` query.
- [x] Versioning: reconcile registry metadata after tagging and validate
  version progression against track-wide tagged releases rather than a
  potentially stale historical snapshot's embedded `version_history`.
- [x] API: route, controller Zod validation, facade/service orchestration,
  deterministic pagination, and OpenAPI contract.
- [x] Migration: backfill registry tagged-release refs and ensure the new index
  on all existing dynamic track collections.
- [x] Regression tests: multiple tracks/releases/revisions, removal after an
  earlier release, retroactive tag, virtual track, draft/non-member exclusion,
  filtering/order/pagination, empty/malformed input, and backfill behavior.
- [x] User/developer docs and Bruno request.
- [ ] Verification: targeted spec first, then the complete `npm test` suite.
  - Targeted endpoint spec: 8 passing; release-track directory: 69 passing;
    lint, OpenAPI validation, and middleware suite pass.
  - `npm test` was attempted three times on 2026-07-16. Each API run reached
    861-880 passing but hit different roaming failures in unrelated legacy
    specs (collection-bundle timeout, missing anonymous-session cookie, and
    transient version lookups). Every failed file passed when rerun in
    isolation. A clean full-suite run is still required before this task meets
    the repository definition of done.

## Snapshot Retention (Squash on Tag)

- [ ] Implement draft-snapshot squashing so release cycles don't accumulate
  unbounded snapshot storage. Design captured 2026-07-15; assessed as sound —
  see analysis below.

### Why

Every mutation clones the full snapshot document (`cloneSnapshot` in
`snapshot-service.js`): metadata edits, config edits, tier operations, and —
critically — every member-sync enrollment. Each snapshot embeds the complete
`members`/`staged`/`candidates` arrays (~100–150 bytes BSON per pin entry).

At ATT&CK scale (~10k–20k tracked objects), each snapshot document is
~1–3 MB. A release cycle where 10% of a 10k-object track is edited produces
~1,000 member-sync snapshots ≈ 1–3 GB of drafts per track per cycle — nearly
all of it intermediate states nobody will ever read again. Storage per cycle
is O(edits × track_size); the per-write clone is the root cause, but squashing
at the tag checkpoint caps the steady state without touching the write path.

Mitigating facts (verified in code):

- Bulk endpoints already exist: `addCandidates`, `promoteCandidates`,
  `reviewCandidates`, `demoteStaged` all take arrays and produce **one**
  snapshot per call. Initial population of a track is 3 snapshots (create →
  bulk-add → bulk-promote), plus an in-place tag (tagging via
  `tagSnapshotInPlace` creates **zero** snapshots). The N-snapshot trap is
  calling the bulk endpoints once per object — document this loudly in user
  docs, but no code change needed there.
- `::created` events for brand-new objects are no-ops for member sync
  (`findTracksReferencingObject` only matches already-tracked `stix.id`s).
  The O(N²) trap is bulk *re-imports/updates* of already-tracked objects
  (e.g. re-importing a modified 20k-object bundle → 20k snapshots × MBs each).
- `version_history` is embedded in and carried forward by every clone, so the
  release ledger survives squashing — tagged snapshots and the latest draft
  always hold the full history.
- Backref reconciliation (`emitContentsChanged`) only ever reads the **latest**
  snapshot; deleting non-latest drafts requires no backref work.

### Semantics

"Squash" = bulk-delete draft snapshots (`version == null`) older than a
boundary, preserving: all tagged snapshots, the boundary snapshot, and always
the latest snapshot. Like `git rebase --squash`ing the commits behind a tag.

1. **Squash-on-tag (opt-in):** `POST /api/release-tracks/:id/bump` (and
   `.../snapshots/:modified/bump`) accept `squash: boolean` (default `false`).
   After a successful tag of snapshot S, delete all snapshots matching
   `{ id, version: null, modified: { $lt: S.modified } }`. Drafts newer than S
   (work already underway toward the next release) survive. Response gains
   `squashed_count`.
2. **Standalone maintenance endpoint** (recovery from bulk-operation
   accidents, no tag required): `POST /api/release-tracks/:id/snapshots/squash`
   with optional `before` (ISO timestamp; defaults to the latest tagged
   snapshot's `modified`; if no tagged release exists and `before` is omitted,
   400). Same delete filter; never deletes the latest snapshot even if it is
   an untagged draft and `before` post-dates it.
3. **Concurrency safety:** the filter can't race member sync — concurrent
   clones get `modified = now`, which is always ≥ the boundary, so they are
   never matched. Tag-then-squash need not be atomic: a crash between the two
   just leaves drafts behind (retryable via the maintenance endpoint).
4. After deletion: one `syncRegistryCounters(trackId)` call; **no**
   `emitContentsChanged` (latest snapshot unchanged by construction). Add a
   repo-level `deleteDraftSnapshotsBefore(trackId, boundary)` (`deleteMany`)
   rather than looping `deleteSnapshot` (which emits per-delete events).

### Drawbacks accepted (documented trade-offs, not blockers)

- **Provenance loss.** Intermediate drafts are the only record of the journey:
  who added/staged what when (`object_added_by`, `object_staged_at`), status
  transitions, `modified-in-place` markers that were later cleared. Promotion
  strips staged metadata from member entries, so after squash only the final
  state remains. This is exactly git-squash semantics and is why the flag is
  opt-in, but teams that need review audit trails must not squash (or we later
  add a roll-up audit record — see Future).
- **Retro-tagging is foreclosed.** `bumpByModified` can no longer tag a
  squashed draft. Consistent by construction: squashing is the declaration
  that intermediates don't matter. Note the "undo/move the tag" worry is
  already moot — versions are immutable once set, re-tagging throws
  `AlreadyReleasedError`, and no untag endpoint exists. The genuine loss is
  forensic/DR, mitigated only by Mongo backups.
- **Virtual tracks: excluded from v1.** Their scheduled snapshots
  (`snapshot_schedule`) exist precisely to build a periodic history;
  squash-on-tag would destroy the thing the schedule creates. Reject
  (or no-op with a warning) squash on virtual tracks until there's a
  considered retention policy for them.

### Alternatives considered

- *Amend-in-place* (member sync mutates the latest draft instead of cloning):
  attacks the root cause but breaks the "every modification is a new
  snapshot" invariant, complicates concurrent reads, and silently degrades
  the audit trail for everyone. Rejected for now.
- *Delta/structural-sharing storage*: large refactor of the snapshot store;
  revisit only if squash proves insufficient.
- *TTL/retention config* (e.g. `config.retention.auto_squash_on_tag`,
  max-draft-age): natural follow-on once manual squash exists.

### Checklist

- [ ] Repo: `deleteDraftSnapshotsBefore(trackId, boundary)` in
  `release-track-dynamic.repository.js` (deleteMany on
  `{ id, version: null, modified: { $lt: boundary } }`, excluding the latest
  snapshot's `modified`).
- [ ] Service: squash logic in `versioning-service.js` (`squash` option on
  `_doBump`) + standalone squash operation (probably `snapshot-service.js`);
  reject for virtual tracks; return `squashed_count`.
- [ ] Controller/routes: `squash` in the Zod bump body schema; new
  `POST /api/release-tracks/:id/snapshots/squash` route with Zod-validated
  optional `before`.
- [ ] OpenAPI: bump request body + new squash path.
- [ ] Regression tests (`release-tracks-squash.spec.js`): squash-on-tag
  deletes only pre-tag drafts; tagged snapshots survive; drafts newer than
  the tagged snapshot survive; latest-draft never deleted by maintenance
  squash; registry counters resync; backrefs untouched; virtual track
  rejected; no-tagged-release + no `before` → 400; idempotent re-squash.
- [ ] Docs: `docs/user/release-tracks/versioning.md` (squash behavior +
  the bulk-endpoints-vs-per-object-loop warning for initial population),
  `docs/developer/release-tracks/` (why, trade-offs, provenance loss).
- [ ] Bruno: bump `.bru` gains `~squash` toggle; new squash request file.

### Future (not in scope)

- Roll-up audit record written at squash time (compact per-object journey
  summary appended to the version_history entry or a side collection) to
  soften the provenance loss.
- Retention config for auto-squash and for virtual-track snapshot history.
- Coalescing/debouncing member-sync snapshots during bulk update storms
  (the re-import O(N²) trap) — e.g. a bulk-import context that suspends
  per-object snapshotting and emits one consolidated snapshot at the end.

## Small Fixes

- [x] **Composition schema mismatch: `priority`.** Resolved 2026-07-29 by
  requiring a unique, non-negative integer priority in request validation,
  persistence, OpenAPI, documentation, and Bruno examples.

- [ ] **`deleteSnapshot` lacks a tagged-release guard.** `DELETE /api/release-tracks/:id/snapshots/:modified` (`snapshot-service.deleteSnapshot`) deletes any snapshot, including tagged releases — contradicting the "immutable once set" versioning rule. Should 409 on `version != null` (a squash implementation must also filter `version: null`; see Snapshot Retention section). Found 2026-07-15 while designing squash.

- [ ] **`syncRegistryCounters` scales with snapshot count.** It fetches *all* snapshots (`getAllSnapshots` with projection) on every clone to recount — O(snapshot_count) reads per write, on the hottest path (member sync). Fine post-squash; consider a count query or incremental counters if draft accumulation between tags is large.

## Diffing Endpoint

- [ ] Implement object diffing endpoints for snapshots. Users should be able to effectively preview changes to objects before tier transitions (candidates, staged, members).

### Idea 1 - Diffing endpoint specifically for release tracks 

In this approach, we would implement a workflow-driven diffing endpoint that is specific to release tracks. The endpoint would allow users to diff objects in the candidate snapshot against their previous revisions in the staged or member snapshots.

```
GET /api/release-tracks/:id/candidates/:objectRef/diff
GET /api/release-tracks/:id/staged/:objectRef/diff
```

If `:objectRef` is a reference to an object that is not part of the candidate snapshot, the endpoint should return a 404 error. If it is part of the candidate snapshot, the endpoint should return a diff between the object in the candidate snapshot and the object in the next lifecycle stage.

To clarify, snapshot objects transition linearly and unidirectionally through the following tier transitions: Candidate -> Staged -> Member

An object exists as a set of one or more revisions. An object is identified by its `stix.id` field, whereas an object revision is identified by its `stix.id` and `stix.modified` fields. 

A revision can exist in exactly one tier at a time.

- If a revision exists in the candidate snapshot, it will not exist in the staged or member snapshots.
- If it exists in the staged snapshot, it will not exist in the candidate or member snapshots. 
- If it exists in the member snapshot, it will not exist in the candidate or staged snapshots.

If a revision exists in the candidate snapshot, it will not exist in the staged or member snapshots. However, a _previous_ revision may exist in the staged or member tiers (though it is not guaranteed). Because the tier transitions are unidirectional, revisions must be temporally ordered as it relates to how they are distributed across the tiers. It should not be possible for a newer revision to exist in a previous tier. For example, if a revision exists in the candidate snapshot, it is not possible for a newer revision to exist in the staged or member snapshots.

This rigidity allows us to implement a diffing endpoint that is specific to release tracks. The diffing endpoint should return a diff between the candidate revision and the next lifecycle stage revision (staged or member).

So, if an object exists in the candidate snapshot, and another/previous revision of it exists in the members state, the diff endpoint should return a diff between the candidate revision and the member revision. If no previous revision exists in the members state, the diff endpoint should return a diff between the candidate revision and an empty object.

As another example, if an object exists in the staged tier, the `GET /api/release-tracks/:id/staged/:objectRef/diff` endpoint should return a diff between it and the previous revision that exists in the member tier. If no previous revision exists in the member state, the diff endpoint should return a diff between the candidate revision and an empty object.

Member revisions are considered immutable and thus cannot be diffed from. Hence, there is no `GET /api/release-tracks/:id/members/:objectRef/diff` endpoint.

There is one edge case that needs special consideration. If a revision exists as a candidate, a previous revision exists as a member, but no previous revision exists in the staged tier, the diff endpoint now becomes unclear: If the candidate transitions to the next tier, one could argue that the diff should be between the candidate revision and an empty object (since no previous revision exists in the staged tier). However, one could also argue that the diff should be between the candidate revision and the previous member revision. I think the most intuitive approach is to return a diff between the candidate revision and the previous member revision. This is because the candidate revision will eventually transition to the staged tier, and it is more intuitive to compare it against the most recent revision that exists in the next lifecycle stage (member) rather than an empty object.

To stick with the example, if a revision exists as a candidate, a previous revision exists as staged, and a previous revision exists as a member, the `GET /api/release-tracks/:id/candidates/:objectRef/diff` diff endpoint should return a diff between the candidate revision and the previous staged revision. This is because the candidate revision will eventually transition to the staged tier, and it is more intuitive to compare it against the most recent revision that exists in the next lifecycle stage (staged) rather than an empty object. Similarly, the `GET /api/release-tracks/:id/staged/:objectRef/diff` diff endpoint should return a diff between the staged revision and the previous member revision. This is because the staged revision will eventually transition to the member tier.

### Idea 2 - Diffing endpoint for all objects (not just release tracks)

Type-centric:
```
GET /api/:type/:id/diff
GET /api/:type/:id/modified/:modified/diff
```

Type-agnostic:

Embed the 
```
GET /api/attack-objects/:id/diff
GET /api/attack-objects/:id/modified/:modified/diff
{
    "compareTo": {
        "type": "attack-pattern",
        "id": "attack-pattern--1234",
        "modified": "2024-02-01T00:00:00.000Z",
    }
}
```

Set up a diffing endpoint that is type-agnostic and allows users to compare any two revisions of an object. The endpoint should accept a request body that specifies the `compareTo` revision, and the endpoint should return a diff between the current revision and the specified `compareTo` revision.
```
GET /api/compare
{
    "compareFrom": {
        "type": "attack-pattern",
        "id": "attack-pattern--1234",
        "modified": "2024-01-01T00:00:00.000Z",
    },
    "compareTo": {
        "type": "attack-pattern",
        "id": "attack-pattern--1234",
        "modified": "2024-02-01T00:00:00.000Z",
    }
}
```



## Repurposing the `note` object

- [ ] Implement support for tracking notes on snapshot objects (can be candidates, staged, or members). Notes should be stored in a separate Mongo collection and linked to the snapshot object via a reference field. Users should be able to add, edit, and delete notes via the API. Notably, we already have a notes service that can be leveraged for this purpose. However, it needs some modifications. The service was originally implemented with STIX in mind. The idea was to treat/represent notes as STIX objects and enable users to include them in emitted STIX bundles. However, the concept never really took off. We should modify the service to treat notes as second-class objects that are entirely separate from STIX, but rather as Workbench-native objects. Notes should be capable of being linked/attached to snapshot objects (candidates, staged, or members) as well as to objects independent of snapshots (documents in the `attackObjects` collection).

Make a new Mongo collection called `notes` to store notes. Each note should have the following fields:

```json
{
  "_id": "ObjectId",
  "content": "string",
  "created_by": "string",
  "last_modified_by": "string",
  "created_at": "Date",
  "modified_at": "Date",
  "snapshot_object_id": "ObjectId", // Reference to the snapshot object (if applicable)
  "object_id": "ObjectId" // Reference to the attack object (if applicable)
}
```

Notes will NOT be version controlled. If they are edited or deleted, the changes will be reflected immediately in the database, and recovery and undo functionality will not be supported.

Links/references between notes and snapshot objects will be one-to-many. A single snapshot object can have multiple notes attached to it, but a note can only be linked to one snapshot object at a time. Similarly, links/references between notes and attack objects will also be one-to-many. These should be bidirectionally tracked, meaning that if a note is linked to an attack object, the attack object should have a reference to the note in its metadata, and vice versa.

```json
// attackObjects collection
{
  "_id": "ObjectId",
  "workspace": {
      "notes": ["ObjectId"] // Array of references to notes linked to this attack object
  },
  "stix": "StixObject",
}
```
