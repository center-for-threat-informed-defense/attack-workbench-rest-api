## Authentication Tests

These tests can be run using an npm script:

```shell
npm run test:authn
```

Note that each test spec is run as a separate mocha job. This is because each spec requires a unique run environment.

### Keycloak

These tests require a keycloak server to be running. The server can be started on Docker with the command:

```shell
docker run -p 8080:8080 -e KC_BOOTSTRAP_ADMIN_USERNAME=admin -e KC_BOOTSTRAP_ADMIN_PASSWORD=admin --name keycloak -d quay.io/keycloak/keycloak:26.0.1 start-dev
docker run -p 8080:8080 -e KEYCLOAK_USER=admin -e KEYCLOAK_PASSWORD=admin --name keycloak -d jboss/keycloak
```

This starts the keycloak server and adds an admin user.
