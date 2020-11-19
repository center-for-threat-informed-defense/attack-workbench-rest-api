# Workspace Data Model

The Federated ATT&CK workspace supports the following ATT&CK object types
(with the corresponding STIX types where applicable):
- Matrix (x-mitre-matrix)
- Technique (attack-pattern)
- Group (intrusion-set)
- Software (malware or tool)
- Mitigation (course-of-action)
- Tactic (x-mitre-tactic)
- Data Source (x-mitre-data-source)
- Collection (x-mitre-collection)
- Identity (identity)
- Marking Definition (marking-definition)
- Relationship (relationship)
- Collection Index

Sample Technique as stored in MongoDB
```json
    _id: ObjectId("5fb1b9d8e1af0600177092ec"),
    __t: "Technique",
    stix: {
        id: "attack-pattern--0f20e3cb-245b-4a61-8a91-2d93f7cb0e9b",
        modified: "2020-06-20T22:29:55.496Z"
        type: "attack-pattern",
    },
    workspace: {
        domains: ["attack-enterprise"],
    }
```

For most objects, the combination of `stix.id` and `stix.modified`
uniquely identify an instance of an object. The `stix.modified` property
distinguishes versions of the `stix.id` object.

The `_id` property also uniquely identifies an object,
but is not used outside of the MongoDB database.
`_id` is necessary because there is no natural property that uniquely identifies an
object by itself. `stix.id` is only unique when combined with `stix.modified`.

### Mongoose Discriminator

Objects of multiple types are stored in the `attackObjects` collection.
This is done to facilitate simpler lookup of objects that may be of different types,
for example, an object that is the `src_ref` or `target_ref` of a `relationship` object.
The Mongoose discriminator capability supports storing multiple object types in
a single collection, while still using a schema that is specific to each object type.
