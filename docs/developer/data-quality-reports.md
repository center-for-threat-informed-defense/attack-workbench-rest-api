# Data quality report query design

## Duplicate relationships: September 2026 memory failure

The Data Quality dashboard's Duplicate Relationships function calls
`GET /api/reports/parallel-relationships`. Previously,
`RelationshipsRepository.retrieveParallelRelationships()` called
`retrieveAll({ versions: 'latest', lookupRefs: true })`. That aggregation joined
**every revision** of each source and target object to **every active latest
relationship**. Awaiting `.exec()` materialized the entire expanded result in
Node. Only then did JavaScript group relationships and discard singleton groups;
the reports service subsequently discarded historical endpoint revisions.

This means a small final report can require a very large intermediate heap.
The endpoint history is repeated for each incident relationship, including
relationships that will never appear in the report. Large descriptions and
workspace backrefs further increase each repeated document's size. Concurrent
dashboard reports can add to the process's overall memory demand.

The supplied container log shows V8 exhausting its roughly 4 GB heap. It does
not identify the allocating JavaScript frame, and no production heap snapshot
or database reproduction was available. The code path and synthetic regression
establish a concrete amplification mechanism consistent with that failure,
not a measurement of the exact production allocation.

## Query implementation

1. Sort by STIX ID and descending modified time, project compact selection
   fields, and choose one latest relationship revision per ID.
2. Exclude revoked/deprecated latest revisions. Filtering earlier would
   incorrectly resurrect an older active revision.
3. Group by source, relationship type, and target, retaining MongoDB IDs and
   counts. Discard groups with fewer than two distinct relationship IDs.
4. Unwind matching IDs and retrieve only those full relationship documents.
5. Join each endpoint with a descending modified sort and limit of one.
   Existing `(stix.id, stix.modified descending)` indexes support latest-revision
   access; the relationship hydration lookup uses the existing `_id` index.
6. Consume the aggregation with a 100-document cursor and explicit cursor
   cleanup. Allow disk use for eligible MongoDB aggregation stages.

The repository preserves the existing arrays of endpoint matches (now at most
one entry each), so identity enrichment and the public JSON map stay compatible.
Missing endpoints still preserve findings. Results retain ascending relationship
STIX-ID ordering. No OpenAPI, Bruno, or frontend contract change is required.

MongoDB documents the pipeline form of
[`$lookup`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/lookup/)
and the top-N optimization for
[`$sort` followed by `$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/sort/).

## Evidence and limits

`app/tests/api/reports/parallel-relationships.spec.js` exercises real MongoDB
aggregation and the HTTP endpoint with ADM validation enabled. Its synthetic
history fixture contains 102 latest active relationships, only two duplicates,
and 41 revisions of their shared source, with 8 KiB descriptions on 40 revisions.
The previous query returned 38,162,701 serialized bytes; the replacement returned
23,131 bytes (about 1,650 times smaller). This measures JSON query-result volume,
not peak heap or elapsed time. The test also covers newest relationship selection,
revoked/deprecated latest revisions, singleton exclusion, and missing endpoints.

Database cursor batching is **not HTTP streaming**. The service still retains
all actual duplicate findings, and Express serializes the complete JSON map.
Memory therefore still scales with the real report size. A very large individual
duplicate group also grows MongoDB's grouped ID array; allowing disk use does not
remove all aggregation or BSON size limits.

If real duplicate output itself is excessive, introduce bounded pagination of
group summaries with relationship details loaded on expansion, coordinated with
the frontend and OpenAPI/Bruno contracts. Incremental NDJSON is another option,
but requires response backpressure, disconnect cancellation, error semantics,
and a frontend streaming parser; the existing Angular JSON request waits for a
complete response. Merely streaming the current query or increasing Node's heap
would leave its unnecessary history fan-out intact.
