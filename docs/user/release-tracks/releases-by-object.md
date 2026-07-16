# Find Tagged Releases Containing an Object

Use the releases-by-object endpoint to find every tagged release whose
`members` tier directly contains a STIX object:

```http
GET /api/release-tracks/objects/{objectRef}/releases
```

`objectRef` is the object's STIX ID, such as
`attack-pattern--11111111-1111-4111-8111-111111111111`. The lookup spans all
stored revisions of that STIX ID. Each result identifies the exact revision
that the release pinned.

## Query parameters

| Parameter | Values                | Default | Meaning                                                                         |
| --------- | --------------------- | ------- | ------------------------------------------------------------------------------- |
| `type`    | `standard`, `virtual` | all     | Restrict results to one release-track type                                      |
| `order`   | `asc`, `desc`         | `asc`   | Sort by snapshot `modified` time; ascending shows lineage from oldest to newest |
| `limit`   | positive integer      | `50`    | Maximum results to return                                                       |
| `offset`  | non-negative integer  | `0`     | Results to skip                                                                 |

## Example

```http
GET /api/release-tracks/objects/attack-pattern--11111111-1111-4111-8111-111111111111/releases?order=asc
```

```json
{
  "object_ref": "attack-pattern--11111111-1111-4111-8111-111111111111",
  "data": [
    {
      "track_id": "release-track--22222222-2222-4222-8222-222222222222",
      "track_type": "standard",
      "track_name": "Enterprise ATT&CK",
      "version": "18.0",
      "snapshot_modified": "2025-10-01T15:00:00.000Z",
      "tagged_at": "2025-10-03T17:12:00.000Z",
      "tagged_by": "user-id",
      "object_modified": "2025-09-22T14:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 50,
    "offset": 0
  }
}
```

## What counts as an appearance

Only direct membership in a tagged snapshot is returned. The endpoint does
not report:

- draft snapshots;
- candidates, staged objects, or quarantined objects;
- secondary objects that appear only because bundle export expands a
  release's direct members.

The oldest result is the object's first known _tagged_ appearance. It does not
identify when the object first entered an untagged working draft.

A syntactically valid STIX ID with no matching releases returns `200 OK` with
an empty `data` array. A malformed STIX ID returns `400 Bad Request`.
