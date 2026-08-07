# Build Information Architecture

Build metadata follows the artifact from semantic release to the user-facing
Workbench navigation without requiring a release process to modify tracked
source files.

| Meaning         | Docker build argument | OCI image label                     | Runtime variable | API/asset field |
| --------------- | --------------------- | ----------------------------------- | ---------------- | --------------- |
| Release version | `VERSION`             | `org.opencontainers.image.version`  | `APP_VERSION`    | `version`       |
| Source commit   | `REVISION`            | `org.opencontainers.image.revision` | `GIT_COMMIT`     | `gitCommit`     |
| Build timestamp | `BUILDTIME`           | `org.opencontainers.image.created`  | `BUILD_DATE`     | `buildDate`     |

## REST API

`app/config/config.js` maps the three runtime variables into `config.app`.
`SystemConfigurationService.retrieveSystemVersion()` returns them with the
component name and supported ATT&CK specification version from the existing
public `GET /api/config/system-version` endpoint.

The Dockerfile already receives all three values from
`@codedependant/semantic-release-docker` and exposes them as both labels and
environment variables. OCI labels cannot be read portably from inside a
running container, so the service uses the environment-variable copy.

When no build environment is present, `version` falls back to `package.json`;
`gitCommit` and `buildDate` fall back to `unknown`. Operators of non-container
artifacts can set `APP_VERSION`, `GIT_COMMIT`, and `BUILD_DATE` when launching
Node. A JSON configuration file can also set `app.version`, `app.gitCommit`,
and `app.buildDate` under the repository's normal configuration precedence.

## Frontend

The frontend is a static Angular application, so environment variables on its
Nginx process are not visible in browser JavaScript. Both `npm run build` and
`npm run build-prod` therefore run `scripts/write-build-info.mjs` as a
post-build step. It writes:

```text
dist/app/browser/assets/build-info.json
```

The frontend Dockerfile exposes `VERSION`, `REVISION`, and `BUILDTIME` to the
Angular build stage. The generated asset consequently matches the image's OCI
labels. A source build uses the frontend package version and `unknown`
provenance values unless the same three runtime variables are supplied to the
build command. `ng serve` uses the checked-in development asset under
`src/assets/build-info.json`.

`BuildInfoService` loads that local asset and the REST API system-version
endpoint in parallel, caches the completed result, and substitutes safe
fallbacks if either component is unavailable. The navigation footer displays
both versions; native title text exposes commit and build-date details without
adding visual noise to the navigation.
