# Release Tracks Frontend TODO

This developer handoff tracks backend release-track changes that require
corresponding work in the Angular frontend. It is intentionally task-oriented,
but each task also explains why the change matters so that it can be
implemented without reconstructing the backend design history.

The current server contract is defined by:

- [Release-track OpenAPI paths](../../app/api/definitions/paths/release-tracks-paths.yml)
- [Release-track API reference](../user/release-tracks/api-reference.md)
- [Virtual-track guide](../user/release-tracks/virtual-tracks.md)
- [Bruno release-track requests](https://gitlab.mitre.org/attack-strategy/bruno/-/tree/main/workbench/Release%20Tracks?ref_type=heads)
- [`internalattack` Python client](https://gitlab.mitre.org/attack-strategy/internalattack-python)

## Endpoint conventions

Keep these rules in mind while updating the connector:

- Operations shared by standard and virtual tracks do not include a type
  namespace. Snapshot retrieval and release operations are shared.
- New virtual-only operations include `/virtual/` in the path.
- The current OpenAPI document is authoritative. Some older standard-only
  workflow routes, such as `/candidates`, `/staged`, and `/contents`, predate
  the namespace convention and do not currently include `/standard/`.
- A release preview is a read-only `GET`. A release commit is a `POST`.

## P0 — Align the Angular connector with the current routes

### [ ] Use only the explicit snapshot-retrieval endpoints

The release-track resource path no longer doubles as an implicit request for
the latest snapshot. `GET /api/release-tracks/:id` was removed before the
feature was officially released, so there is no compatibility alias.

Update the frontend to use:

```text
GET /api/release-tracks/:id/snapshots
GET /api/release-tracks/:id/snapshots/latest
GET /api/release-tracks/:id/snapshots/:modified
```

Required work:

- Keep `getLatestSnapshot()` on `/snapshots/latest`.
- Update the integration test that still calls `GET /release-tracks/:id`.
- Remove any fallback that interprets a full snapshot or `version_history` as
  the snapshot-list response.
- Remove the unsupported `releases=only` option from track-list and
  snapshot-retrieval types. Tagged-state filtering now belongs on the snapshot
  history endpoint as `tagged=true`.

Done when:

- No Angular code calls `GET /api/release-tracks/:id`.
- Connector and integration tests assert the three explicit retrieval paths.

### [ ] Move virtual-only operations under `/virtual/`

Virtual composition and materialization are now visibly scoped in the URL:

```text
PUT  /api/release-tracks/:id/virtual/composition
POST /api/release-tracks/:id/virtual/snapshots/create
```

The Angular connector still calls the older `/composition` and
`/snapshots/create` paths. Update those paths and their tests.

Also remove:

```text
GET /api/release-tracks/:id/snapshots/preview
```

That endpoint no longer exists. It recomputed a hypothetical virtual
composition without persisting it, which overlapped confusingly with release
preview. Creating a virtual draft is now an explicit operation. The current
`onDraft()` flow should therefore open a confirmation dialog and call the
create endpoint directly instead of first calling `previewVirtualSnapshot()`.

Done when:

- `updateComposition()` calls `/virtual/composition`.
- `createVirtualSnapshot()` calls `/virtual/snapshots/create`.
- `previewVirtualSnapshot()` and its UI/test fixtures are removed.
- Creating a virtual draft still asks for confirmation, but does not depend on
  a nonexistent preview payload.

## P0 — Replace “bump” with the release contract

### [ ] Rename bump-oriented frontend symbols and user-facing text

“Release” is now the operation name throughout the API. The server has no
`/bump` routes, and retaining bump terminology in Angular makes logs, types,
tests, and UI copy disagree with the public contract.

Suggested renames:

```text
BumpPayload       -> ReleasePayload
previewBump()     -> previewRelease()
bumpByLatest()    -> releaseLatest()
bumpByModified()  -> releaseSnapshot()
bumpRelease()     -> releaseSnapshot()
```

Update comments, test names, log messages, and errors such as “Failed to
preview release track bump” at the same time.

Done when:

- “bump” is absent from the release-track connector, models, components, and
  tests unless it appears in a historical explanation.
- Angular method names distinguish previewing from committing a release.

### [ ] Replace the old release request body

The current frontend `BumpPayload` is obsolete:

```ts
{
  type?: 'major' | 'minor';
  version?: string;
  dry_run?: boolean;
}
```

The release body is now:

```ts
{
  increment?: 'major' | 'minor';
  version?: string; // exact MAJOR.MINOR, for example "14.1"
}
```

The rules are:

- `increment` and `version` are mutually exclusive.
- Supplying both returns `400 Bad Request`.
- Omitting both asks the server for the default minor increment.
- `dry_run` was removed. Use a release-preview representation instead.
- `expected_snapshot_modified` is not required. Choosing `latest` means the
  caller accepts whichever snapshot is latest when the server handles the
  request; choosing `:modified` explicitly pins the target.

Use the same selector in the preview query and the release request body. For
example:

```text
GET  .../release/preview?format=summary&increment=major
POST .../release
Body: { "increment": "major" }
```

Done when:

- Angular never sends `type`, `dry_run`, or
  `expected_snapshot_modified` in a release request.
- The UI can select `major`, `minor`, or an explicitly entered `MAJOR.MINOR`
  version and validates mutual exclusivity before calling the server.

## P0 — Correct the release-preview flow

### [ ] Treat release preview as a `GET` with representation-specific output

Both track types use the same preview routes:

```text
GET /api/release-tracks/:id/snapshots/latest/release/preview
GET /api/release-tracks/:id/snapshots/:modified/release/preview
```

The supported preview formats are:

- `summary` — a before/after delta; this is the default
- `workbench` — the complete snapshot that would be persisted
- `bundle` — the publication-ready STIX bundle
- `filesystemstore` — reserved but currently returns `501 Not Implemented`

The existing Angular flow requests `format=workbench` and then reads summary
fields such as `next_version_minor` and `staged_count`. Those are different
representations and must not be mixed.

Recommended interaction:

1. Ask the operator to choose `major`, `minor`, or an exact version.
2. Request `format=summary` using that selector.
3. Render the returned `version`, `before`, `after`, `changes`, and
   `conflicts`.
4. Optionally let the operator inspect `format=workbench` or `format=bundle`
   using the same selector.
5. Commit the release using the same selector only after confirmation.

The summary contains the planned `version`; it does not return separate
`next_version_minor` and `next_version_major` fields.

Done when:

- The confirmation dialog is driven by a `summary` response.
- Workbench and bundle previews are treated as literal payloads, not deltas.
- The preview and commit always use the same target snapshot and version
  selector.

### [ ] Render standard and virtual summaries differently

Standard and virtual snapshots share the preview endpoint, but their deltas
answer different questions.

For a standard track:

- `before` is the selected draft.
- `after` is the would-be release after staged objects become members.
- Counts are oriented around `members_count`, `staged_count`, and
  `candidates_count`.

For a virtual track:

- `before` is the tagged release immediately preceding the selected draft.
- `after` is the selected, already-materialized virtual draft.
- Counts are oriented around `members_count` and `quarantine_count`.
- `previous_release` identifies the comparison baseline when one exists.
- `changes` can include `new_count`, `updated_count`, `removed_count`, and
  `quarantined_count`.

Virtual release does not promote staged objects because virtual tracks do not
have a staged tier. Avoid showing zero-valued staged/candidate statistics as
though they described the virtual workflow.

Done when:

- Summary rendering branches on the top-level `type`.
- Standard previews explain staged-to-member promotion.
- Virtual previews explain the delta from the preceding tagged release.
- A first virtual release handles `previous_release: null` cleanly.

## P0 — Represent virtual materialization state

### [ ] Show when a virtual draft is awaiting materialization

Saving a new virtual composition now invalidates the preceding materialized
contents. The new latest draft intentionally has:

```json
{
  "type": "virtual",
  "members": [],
  "quarantine": [],
  "composition_resolution": null
}
```

This does not mean that the composition resolved to an empty release. It means
the composition has changed and the operator must explicitly materialize a new
draft with:

```text
POST /api/release-tracks/:id/virtual/snapshots/create
```

Until that succeeds, shared release preview and release commit endpoints return
`409 Conflict`.

Required work:

- Treat `type === 'virtual' && composition_resolution == null` as “awaiting
  materialization.”
- Show an explanatory state rather than an ordinary empty-members view.
- Disable release actions and make “Create Draft” the primary next action.
- After a composition update, refresh both the latest snapshot and history so
  the newly invalidated draft is visible.
- Surface a helpful error when a component track has no tagged snapshots. A
  virtual materialization can only consume tagged `members` from its component
  standard tracks.

Done when:

- Operators cannot accidentally interpret an unmaterialized draft as a valid
  empty virtual release.
- A `409` from preview/release explains that materialization is required
  instead of being swallowed as a null preview.

### [ ] Keep standard-only mutations out of virtual-track controls

Direct contents replacement is now explicitly rejected for virtual tracks:

```text
POST /api/release-tracks/:id/contents
POST /api/release-tracks/:id/snapshots/:modified/contents
```

Virtual membership has one authority: composition materialization followed by
optional quarantine resolution. Both contents endpoints return `400 Bad
Request` for a virtual track.

Hide direct member replacement, candidate, and staged controls when
`type === 'virtual'`. Keep them available for standard tracks on their current
routes.

Done when:

- A virtual-track screen does not offer actions the server will reject because
  they belong to the standard workflow.

## P0 — Consume snapshot history as summaries

### [ ] Type and paginate the snapshot-history response

`GET /api/release-tracks/:id/snapshots` returns a paginated envelope:

```json
{
  "data": [],
  "pagination": {
    "total": 0,
    "limit": 50,
    "offset": 0
  }
}
```

Supported query parameters are:

- `tagged=true` — tagged releases only
- `tagged=false` — untagged drafts only
- omit `tagged` — both; this is the no-filter default
- `limit` — 1 through 200, default 50
- `offset` — zero or greater

The current connector discards `pagination`, accepts no filters, and contains
fallback normalization for older response shapes. Replace that compatibility
logic with the explicit envelope. Otherwise tracks with more than 50
snapshots are silently truncated.

Done when:

- The connector accepts `tagged`, `limit`, and `offset`.
- The component retains pagination metadata and supports paging or loading
  more results.
- There is a clear UI control for all snapshots, releases only, and drafts
  only.

### [ ] Use the type-oriented snapshot summary fields

Snapshot history entries are lightweight summaries, not full snapshots. All
entries include:

```text
id, type, modified, version, name, description, members_count
```

Standard entries additionally include:

```text
staged_count, candidates_count
```

Virtual entries additionally include:

```text
quarantine_count
```

These counts are top-level fields. They are not nested beneath `summary`, and
the history endpoint does not return the tier arrays needed to derive object
deltas. The current `buildSnapshotHistory()` logic therefore reports zero for
several values and should not calculate “Added” or “Modified” by comparing
missing member arrays.

Required work:

- Define a discriminated union keyed by `type: 'standard' | 'virtual'`.
- Read the top-level count fields directly.
- Show standard counts as members/staged/candidates.
- Show virtual counts as members/quarantine.
- If the design still needs per-object added/updated/removed deltas, retrieve
  an appropriate release summary or full snapshots explicitly rather than
  inferring them from the lightweight list response.

Done when:

- Snapshot cards display accurate counts for both track types.
- No history calculation assumes the list response contains `members`,
  `staged`, `candidates`, or `quarantine` arrays.

## P1 — Add the virtual quarantine-resolution workflow

### [ ] Let an operator select an exact quarantined revision

The backend now provides:

```text
POST /api/release-tracks/:id/virtual/quarantine/promote
```

Request body:

```json
{
  "object_ref": "attack-pattern--11111111-1111-4111-8111-111111111111",
  "object_modified": "2024-02-01T10:00:00Z"
}
```

The `(object_ref, object_modified)` pair must exactly match an entry in the
latest virtual snapshot's quarantine tier. On success, the server creates a
new draft, places the selected revision in `members`, removes every
quarantined alternative for that object, and preserves the original snapshot
for history and provenance.

Suggested UI:

- Group quarantine entries by `object_ref`.
- Show every conflicting revision, its modified timestamp, and any available
  source/component context.
- Require the operator to choose one exact revision.
- Confirm that the other alternatives will be removed from the new draft.
- Refresh the latest snapshot and history after success.

Error behavior:

- `400` — malformed body or the target track is not virtual
- `404` — that exact revision is no longer quarantined in the latest snapshot

A `404` is often a stale-screen condition. Refresh the latest snapshot and ask
the operator to review the current alternatives rather than retrying the old
selection automatically.

Done when:

- Each quarantined conflict has an explicit resolution action.
- The request always includes both the STIX ID and exact modified timestamp.
- Successful promotion updates members, quarantine, and snapshot history in
  the UI.

## P1 — Expose implemented virtual component filters

### [ ] Add plural `filters.domains` to component-track editing

Virtual composition can filter the exact revisions contributed by each
component track:

```json
{
  "filters": {
    "object_types": ["intrusion-set", "malware"],
    "domains": ["enterprise", "mobile"]
  }
}
```

Both public domain names (`enterprise`, `ics`, `mobile`) and their STIX names
(`enterprise-attack`, `ics-attack`, `mobile-attack`) are accepted. Prefer the
short public names in Angular controls for consistency.

The key is plural: `domains`. Do not send `filters.domain`; that typo does not
enable filtering. The backend now rejects that typo with `400 Bad Request`.

Objects without domain metadata are excluded when a domain filter is active.
This is expected behavior, not a partial match.

Composition payloads are strict at every nested level. Do not preserve
frontend-only properties in the submitted composition, component, filter, or
deduplication objects. Component selector fields must also follow the selected
strategy:

- `latest_tagged` sends neither `version` nor `snapshot`.
- `specific_version` sends `version` and omits `snapshot`.
- `specific_snapshot` sends `snapshot` and omits `version`.

Done when:

- Each virtual component row can select zero or more domains.
- Saved and reloaded composition preserves `filters.domains`.
- Tests assert the plural key and multi-domain payload shape.
- Changing resolution strategy clears the selector from the previous strategy.
- Submitted composition payloads contain only server-supported properties.

## P1 — Separate snapshot and preview output-format types

### [ ] Remove the invalid `snapshot` format and model `summary` correctly

The frontend currently uses one `ExportFormat` enum for endpoints with
different contracts and includes `Snapshot = 'snapshot'`, which the server
rejects.

Use separate types:

```ts
type SnapshotOutputFormat = 'workbench' | 'bundle' | 'filesystemstore';

type ReleasePreviewFormat = 'summary' | 'workbench' | 'bundle' | 'filesystemstore';
```

`filesystemstore` should remain disabled or clearly marked unavailable until
the server implementation exists.

For workbench snapshot retrieval, `include` may select `members`, `staged`,
`candidates`, `quarantine`, or `all`. Ensure virtual inspection can request
quarantine and that the type does not restrict `include` to standard tiers.

Done when:

- Angular cannot send `format=snapshot`.
- `summary` is available only where the release-preview endpoint supports it.
- Virtual workbench retrieval can include quarantine.

## P1 — Update frontend tests around the public contract

### [ ] Replace stale fixtures and add standard/virtual lifecycle coverage

Update connector, component, and integration tests together so old mock shapes
do not keep obsolete behavior alive.

Minimum regression coverage:

- Canonical latest retrieval uses `/snapshots/latest`.
- Snapshot history preserves `{ data, pagination }` and supports `tagged`.
- Release preview uses `GET`, `format=summary`, and query-based version
  selection.
- Release commit uses `{ increment }` or `{ version }`.
- Latest and timestamp-selected releases use the same contract.
- Virtual composition and materialization use `/virtual/` paths.
- The removed virtual snapshot-preview method is absent.
- An unmaterialized virtual draft disables release and explains a `409`.
- Standard and virtual summary fixtures use their respective count fields.
- Quarantine promotion sends an exact object revision and handles stale `404`
  responses.
- The frontend never offers standard-only contents/candidate/staged mutations
  on a virtual track.

## Backend changes that do not require Angular API changes

The following changes are useful context but should not create extra connector
work:

- Snapshot bundle exports now include valid secondary relationships
  dynamically. Existing bundle download code receives a more complete bundle
  without changing its request.
- Release-track object back-references are reconciled when snapshots change.
  Frontend object refreshes will see the updated membership metadata without a
  new endpoint.
- The server intentionally does not require
  `expected_snapshot_modified`. Do not add a client-side precondition field.
- Virtual release preview and release use the same shared routes as standard
  tracks after materialization; do not create separate virtual release
  endpoints.
