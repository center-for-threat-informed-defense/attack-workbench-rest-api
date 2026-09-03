# Data Quality Reports

Read-only analytical endpoints under `/api/reports` that surface content
problems for editors to fix at the source. All require the visitor role or
higher. The Workbench frontend renders them on the dashboard's **Data
Quality** page.

## Missing LinkById references

```
GET /api/reports/link-by-id/missing?type=attack-pattern
```

Objects and relationships whose description mentions `attack.mitre.org`
directly instead of using a `(LinkById: ID)` reference. `type` narrows the
result to one STIX type (`relationship` for relationships only).

## Parallel relationships

```
GET /api/reports/parallel-relationships
```

Latest relationship revisions grouped by `source_ref--relationship_type--target_ref`
where more than one relationship shares the key — likely duplicates. The
response is a map from that key to the array of relationships, each carrying
its latest `source_object` and `target_object`.

## Domain consistency

```
GET /api/reports/domain-consistency
```

Release-track bundles never discover objects through relationships: a
relationship ships only when both of its endpoints are members of the same
track (see [Output Formats](release-tracks/output-formats.md)). Content whose
endpoints can never be members of the same domain track is therefore
unpublishable, and this report lists it:

- `cross_domain_relationships` — latest revisions of active (not revoked, not
  deprecated) relationships whose source and target objects share no
  `x_mitre_domains` value. Each entry is the relationship document plus the
  latest `source_object` and `target_object` and their `source_domains` and
  `target_domains`. Endpoints are evaluated at their latest revision, so
  adding the missing domain in a new revision of the object clears the
  finding. A relationship whose endpoint is missing or declares no domain is
  not listed here.
- `objects_without_domains` — latest revisions of active domain-bearing ATT&CK
  objects (techniques, tactics, groups, software, mitigations, campaigns,
  data sources, data components, assets, matrices, detection strategies,
  analytics) that declare no domain.
- `summary` — counts of both lists.

```json
{
  "cross_domain_relationships": [
    {
      "stix": { "id": "relationship--...", "relationship_type": "uses", "...": "..." },
      "source_object": { "stix": { "id": "intrusion-set--...", "...": "..." } },
      "target_object": { "stix": { "id": "attack-pattern--...", "...": "..." } },
      "source_domains": ["enterprise-attack"],
      "target_domains": ["mobile-attack"]
    }
  ],
  "objects_without_domains": [{ "stix": { "id": "attack-pattern--...", "...": "..." } }],
  "summary": { "cross_domain_relationship_count": 1, "objects_without_domains_count": 1 }
}
```

Fix a finding by revising the object with the domain it belongs to, or by
deprecating the relationship.
