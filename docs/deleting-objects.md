## Deleting Objects

### Rules
- Objects can be "hard" deleted or "soft" deleted.
- Hard deleting an object results in the document being removed from the database. It is no longer retrievable.
- Soft deleting an object results in the document being marked as deleted, but it isn't removed from the database.
- An object is marked as deleted by setting the `workspace.workflow.soft_delete` property to `true`.
- For all queries, an object that is soft deleted is treated exactly as if it was hard deleted, unless the query includes
the `includeDeleted=true` query parameter.
- If that query parameter is set, the `workspace.workflow.soft_delete` property is ignored.

### Discussion

The overall data strategy for Workbench doesn't include deleting objects as a normal part of operation.
The expectation is that STIX objects that are no longer valid will be either deprecated or revoked, not deleted.
However, there is one use case where deleting a STIX object is valid:
- A STIX object has been created, but it is determined that the object was created in error, it is a duplicate, 
or that some other editing problem has occurred
- The STIX object has not been published as part of a collection
- No history of the object is required

In this situation, deleting a STIX object from Workbench may be appropriate.

There is also the expectation that all versions of the STIX object will be deleted, not just a particular version.
The REST API supports deleting a single version of a STIX object, but this is provided for completeness and in support
of possible future requirements, not for immediate use.

Soft deleting an object (rather than hard deleting it) makes it possible to reverse the deletion,
in case the deletion was in error or the STIX object was later determined to be necessary after all.
Reversing a soft deletion is performed by setting the `workspace.workflow.soft_delete` property to `false`.
However, the REST API does not provide support for reversing the deletion.
That must be done by modifying the database through some other means.

Note that the query behavior for soft deleted objects is not the same as for deprecated or revoked objects.
That is, the logic for queries when the `includeDeleted` query parameter is set to `true` is not the same as when
the `includeDeprecated` or `includeRevoked` query parameters are set.
- The `includeDeprecated` and `includeRevoked` query parameters are only applicable when retrieving all objects of a particular type.
- In addition, when retrieving all objects of a particular type, the query automatically restricts itself to the latest
version of each STIX object, and the includeDeprecated and includeRevoked logic is applied to those (latest)
versions of the STIX objects.
- The `includeDeleted` query parameter is allowed when retrieving all objects of a type, when retrieving one or more
versions of a particular STIX object, and when retrieving a particular version of a STIX object.
- The `includeDeleted` query parameter is applied to the entire query.
