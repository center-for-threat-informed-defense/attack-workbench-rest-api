# Authentication

This document describes the authentication design for the ATT&CK Workbench REST API.
Please refer to [doc ref goes here] for instructions on configuring authentication, and [doc ref goes here] for instructions on managing users.

The ATT&CK Workbench REST API can be configured to use one of the implemented user authentication mechanisms.
The currently implemented user authentication mechanisms are:
- Anonymous
- OpenID Connect (OIDC)

The default authentication mechanism is _anonymous_.
This simplifies deployment of the application for users who are running the ATT&CK Workbench locally.
However, anonymous authentication does not provide attribution of changes to individual users and is not recommended for enterprise deployments.

The REST API also implements an API key authentication mechanism to support access by the ATT&CK Workbench Collection Manager and other services.

The REST API uses the passport module for authentication which will facilitate the addition of other authentication mechanisms in the future.

## User Authentication

### User Authentication Endpoints

#### General Endpoints

##### Get Config
```
GET /api/config/authn
```

Retrieves information describing the available user authentication mechanisms.
This is intended to be used by the client to determine which authentication mechanisms are available to be used and does not require the user to be logged in.

Authentication Config Object:

| Property       | Type       | Description                                                                    |    
|----------------|------------|--------------------------------------------------------------------------------|
| **mechanisms** | [ string ] | Configured user authentication mechanisms (allowed values: `oidc`, `anonymous`) |

Note: The current release of the ATT&CK Workbench REST API only allows one user authentication mechanism to be configured at a time.
Multiple simultaneous mechanisms may be supported in a future release.

##### Get Session
```
GET /api/session
```

Retrieves the current user session object for a logged in user. If the user is not logged in returns `401 Not authorized`.

User Session Object:

| Property        | Type    | Description                                     |    
|-----------------|---------|-------------------------------------------------|
| **email**       | string  | email address                                   |
| **name**        | string  | full name                                       |
| **status**      | string  | allowed values: `pending`, `active`, `inactive` |
| **role**        | string  | allowed values: `visitor`, `editor`, `admin`    |
| **identity**    | object  | STIX identity assigned to this user             |
| **registered**  | boolean | has the user been added to the database?        |

A user who is in the process of registering and has logged in but has not been added to the database


#### Anonymous Endpoints

Anonymous authentication is primarily intended to be used when the ATT&CK Workbench is deployed on a machine for local use by a single user.
It does not provide any authentication or authorization of access to the system, and does not provide attribution of changes to individual users.

##### Log In
```
GET /api/authn/anonymous/login
```

Logs the user into the REST API. Does not require credentials.

##### Log Out
```
GET /api/authn/anonymous/logout
```

Logs the user out of the REST API.

#### OpenID Connect Endpoints

OIDC authentication is intended for use in an organizational setting and can be tied into the organization's single-sign on configuration.

##### Log In
```
GET /api/authn/oidc/login?destination=<url>
```

Initiates the OIDC login sequence.

⚠️ Sending a request to this endpoint will result in a redirect to the OIDC Identity Provider.
Therefore, the call to this endpoint must be a standard HTTP request (not an XHR type request).

The `destination` query string parameter provides a URL that the client will be redirected to after a successful login.

##### OIDC Callback
```
GET /api/authn/oidc/callback
```

This endpoint handles the redirect from the OIDC Identity Provider after the user authenticates with that server.
The full URL of this endpoint on the deployed server is part of the OIDC Identity Provider configuration.

This endpoint will respond with a redirect to the `destination` provided in the initial log in request.
In most cases this will be the start page of the client application which should verify the login by requesting the current user session object.

##### Log Out
```
GET /api/authn/oidc/logout
```

Logs the user out of the REST API. Note that this only logs the user out of the ATT&CK Workbench REST API.
It does not log the user out of the OIDC Identity Provider.

### User Authentication Workflow

1. The client starts by calling `GET /api/session`
   * If logged in, will receive the user session object
   * If not logged in, will receive 401 Not Authorized

2. To log in, the client will call `GET /api/config/authn` to get the authentication config object
   * If the supported authentication is anonymous, call `GET /api/authn/anonymous/login`
   * If the supported authentication is oidc, navigate to `GET /api/authn/oidc/login`

3. After logging in, call `GET /api/session` to get the user session object

### Authenticating REST API Calls

A successful log in will result in the creation of a persistent login session on the server.
The user's browser will receive a session cookie with the generated login Session ID.
This cookie must be provided on all REST API calls in order to authenticate the user.
This will generally be handled automatically by the browser.

## Server Authentication

### Server Authentication Endpoints

#### API Key Endpoints

The API key endpoints are intended to support other ATT&CK Workbench services.

Note: Rather than allow a service to use its API key directly in requests to the REST API, a service is required to log in using its API key and obtain a JSON Web Token (JWT).
The JWT must then be provided in subsequent requests.
This extra step is intended to provide an additional layer of security.
For example, the deployment could be configured such that the service log-in endpoint is secured separately from the other endpoints, with access only allowed from particular hosts (those running the authorized services).
This would make it more difficult for a malicious user to utilize a stolen API key.
The use of a JWT also allows for a login session to expire, forcing the service to periodically log in again.

##### Log In
```
GET /api/authn/service/login
```

Logs the service into the REST API. The request must include the API key configured for that service.
The response will include a JWT that must be provided on subsequent requests.

##### Log Out
```
GET /api/authn/service/logout
```

Logs the service out of the REST API.

### Authenticating REST API Calls

A successful log in will result in the creation of a persistent login session on the server.
The response to the login endpoint will contain a JWT.
This JWT must be provided on all REST API calls in order to authenticate the service.
The JWT must be provided using the `Authorization` header with the `Bearer` authentication scheme:

```
Authorization: Bearer <jwt>
```
