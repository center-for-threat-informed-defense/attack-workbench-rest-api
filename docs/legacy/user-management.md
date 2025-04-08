# User Management

This document describes the user management design for the ATT&CK Workbench REST API.
Please refer to [doc ref goes here] for instructions on configuring authentication, and [doc ref goes here] for instructions on managing users.

## User Account Document

Each registered user has an associated user account document in the database.

The User Account document has the following properties:

| property        | type   | description                                                                              |
| --------------- | ------ | ---------------------------------------------------------------------------------------- |
| **id**          | string | Unique id for this user, assigned when the user account is created                       |
| **email**       | string | User's email address                                                                     |
| **username**    | string | Name used to authenticate with the identity provider (commonly the user's email address) |
| **displayName** | string | User's display name                                                                      |
| **status**      | string | `pending`, `active`, or `inactive`                                                       |
| **role**        | string | `visitor`, `editor`, `admin`, or undefined                                               |

## User Status

| status     | description                                                              |
| ---------- | ------------------------------------------------------------------------ |
| `pending`  | The user has registered with the workspace and is waiting to be approved |
| `active`   | The user has been registered and approved                                |
| `inactive` | The user is no longer active                                             |

### Typical User Status Workflow

1. A user requests access to the system and is registered with the workspace. This results in a User Account document being added to the database with the status set to `pending` and the role set to undefined
2. A user with the `admin` role approves the pending user and sets their role. This results in the user's status changing to `active` and their role being set appropriately.
3. Later, a user with the `admin` role marks the user as inactive. This results in the user's status changing to `inactive`.

## Roles

The ATT&CK Workbench supports the following roles:

| role      | description                                                                         |
| --------- | ----------------------------------------------------------------------------------- |
| `none`    | No access to the system allowed.                                                    |
| `visitor` | Read access to all of the ATT&CK objects in the workspace.                          |
| `editor`  | Read and write access to all of the ATT&CK objects in the workspace, except for ??? |
| `admin`   | Full access to all capabilities of the system.                                      |

Note that `none` is not a valid value for a user account saved in the database.
It is only used as a possible effective role for pending and inactive users accounts.
The `role` property of pending and inactive user accounts in the database should be undefined.

### Effective User Roles

For users who are registered and active, their effective role will always be the role that was assigned to them.

Some organizations may want to allow access to the system for users who aren't registered and active.
The effective roles for these users is as specified in the following table:

| authentication | user registered and logged in? | user status | effective role | default |
| -------------- | ------------------------------ | ----------- | -------------- | ------- |
| anonymous      | no                             | --          | `admin`        | --      |
| OIDC           | no                             | --          | configurable   | `none`  |
| OIDC           | yes                            | pending     | configurable   | `none`  |
| OIDC           | yes                            | active      | as assigned    | --      |
| OIDC           | yes                            | inactive    | configurable   | `none`  |

Note that the default OIDC configuration only allows registered and active users to access the system.
The system must be specifically configured to allow other users access.
As shown in the table, the default role for users who aren't registered and active is `none`

## User Management Endpoints

These endpoints are disabled if the app is configured to use the anonymous authentication mechanism.
The STIX ID of the corresponding identity object is used by the user management endpoints as the unique identifier for a user.

##### Get Users

```
GET /api/user-accounts
```

Retrieves a list of user account documents (i.e., registered users).

Query string parameters for searching are TBD.

###### Authorization

This endpoint will only be available to users with the `admin` role.

##### Get User

```
GET /api/user-accounts/:id
```

Retrieve a user account document by its id.

###### Authorization

This endpoint will only be available to users with the `admin` role or for a logged in user with the matching user account `id`.

##### Register User

```
POST /api/user-accounts/register
```

Create a new user document in the database.
This results in a registered user.
The user document will have the `email` and `username` properties set based on the log in data.
`status` will be set to pending and `role` will be set to null.

###### Authorization

This endpoint will only be available for a logged in user who is in the process of registering.

##### Update User

```
PUT /api/user-accounts/:id
```

Update an existing user document in the database.

###### Authorization

This endpoint will only be available to users with the `admin` role.

## Initial User Configuration

Unless the app is configured to use the anonymous authentication mechanism,
it will be necessary to have a way to provision an initial admin user that can then be used to create the other users.
The design for provisioning the initial admin user is TBD.
