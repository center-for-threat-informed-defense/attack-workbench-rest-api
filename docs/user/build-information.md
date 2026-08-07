# Build Information

The REST API exposes the running component's build information through a
public endpoint:

```http
GET /api/config/system-version
```

No login or service credential is required. A response has this shape:

```json
{
  "name": "attack-workbench-rest-api",
  "version": "4.20.0-beta.23",
  "gitCommit": "c2c017c146fae040caba559333b35536bfbd1189",
  "buildDate": "2026-08-05T15:13:49.915Z",
  "attackSpecVersion": "3.3.0"
}
```

`version`, `gitCommit`, and `buildDate` identify the deployed REST API
artifact. `attackSpecVersion` is separate: it identifies the ATT&CK
specification version supported by that API build.

Published Docker images populate the build fields from the same values used
for the `org.opencontainers.image.version`,
`org.opencontainers.image.revision`, and `org.opencontainers.image.created`
labels. A non-container source deployment falls back to the package version
and reports unavailable commit or date values as `unknown` unless its operator
sets the corresponding runtime configuration.

The Workbench frontend shows its own version and the REST API version at the
bottom of the primary navigation. Hover over either value to see its commit
and build date.
