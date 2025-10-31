# ATT&CK Workbench REST API Usage Guide

This guide provides comprehensive instructions for installing, configuring, and administering the ATT&CK Workbench REST API service.

## Table of Contents

- [ATT\&CK Workbench REST API Usage Guide](#attck-workbench-rest-api-usage-guide)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Installation Methods](#installation-methods)
    - [Docker Installation](#docker-installation)
      - [Using Docker Compose (Recommended)](#using-docker-compose-recommended)
      - [Standalone Docker Deployment](#standalone-docker-deployment)
    - [Manual Installation](#manual-installation)
      - [Requirements](#requirements)
      - [Installation Steps](#installation-steps)
  - [Configuration](#configuration)
    - [Environment Variables](#environment-variables)
    - [Configuration File](#configuration-file)
  - [Task Scheduling](#task-scheduling)
    - [Collection Indexes Synchronization Task](#collection-indexes-synchronization-task)
    - [ATT\&CK ID Reservation Monitoring Task](#attck-id-reservation-monitoring-task)
  - [Authentication](#authentication)
    - [Authentication Mechanisms](#authentication-mechanisms)
    - [OpenID Connect (OIDC) Configuration](#openid-connect-oidc-configuration)
    - [Service Authentication](#service-authentication)
  - [User Management](#user-management)
    - [User Roles and Permissions](#user-roles-and-permissions)
    - [User Account Status](#user-account-status)
    - [User Management Endpoints](#user-management-endpoints)
  - [API Documentation](#api-documentation)
  - [Management and Administration](#management-and-administration)
    - [Health Checks](#health-checks)
    - [Logging](#logging)
    - [Backup and Restore](#backup-and-restore)
  - [Troubleshooting](#troubleshooting)

## Overview

The ATT&CK Workbench REST API provides services for storing, querying, and editing ATT&CK objects. It is built on Node.js and Express.js, and uses MongoDB for data persistence.

This component is part of the larger ATT&CK Workbench application, which includes:
- [ATT&CK Workbench Frontend](https://github.com/center-for-threat-informed-defense/attack-workbench-frontend)
- [ATT&CK Workbench REST API](https://github.com/center-for-threat-informed-defense/attack-workbench-rest-api) (this component)

## Installation Methods

### Docker Installation

The recommended deployment method is using Docker. The REST API is published as a Docker image to the GitHub Container Registry.

#### Using Docker Compose (Recommended)

The simplest way to deploy the entire ATT&CK Workbench application is using Docker Compose. Instructions are available in the [Workbench Deployment Guide](https://github.com/mitre-attack/attack-workbench-deployment).

#### Standalone Docker Deployment

To run only the REST API in a Docker container:

1. **Create a Docker network** (if not already created):
   ```shell
   docker network create attack-workbench-network
   ```

2. **Run MongoDB container**:
   ```shell
   docker run --name attack-workbench-mongodb -d \
     --network attack-workbench-network \
     mongo:latest
   ```

3. **Run REST API container**:
   ```shell
   docker run -p 3000:3000 -d \
     --name attack-workbench-rest-api \
     --env DATABASE_URL=mongodb://attack-workbench-mongodb/attack-workspace \
     --network attack-workbench-network \
     ghcr.io/center-for-threat-informed-defense/attack-workbench-rest-api:latest
   ```

For more advanced configurations, you can use a configuration file:

```shell
docker run -p 3000:3000 -d \
  --name attack-workbench-rest-api \
  --env JSON_CONFIG_PATH=/usr/src/app/settings/config.json \
  --volume /path/to/your/config:/usr/src/app/settings \
  --network attack-workbench-network \
  ghcr.io/center-for-threat-informed-defense/attack-workbench-rest-api:latest
```

### Manual Installation

#### Requirements

- [Node.js](https://nodejs.org) version `22.x` or greater
- [MongoDB](https://www.mongodb.com/) version `8.x` or greater

#### Installation Steps

1. **Clone the repository**:
   ```shell
   git clone https://github.com/center-for-threat-informed-defense/attack-workbench-rest-api.git
   cd attack-workbench-rest-api
   ```

2. **Install dependencies**:
   ```shell
   npm install
   ```

3. **Configure the application** using environment variables or a configuration file (see [Configuration](#configuration)).

4. **Start the application**:
   ```shell
   node ./bin/www
   ```

## Configuration

The REST API can be configured using environment variables, a configuration file, or a combination of both. Configuration file values take precedence over environment variables.

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| **PORT** | No | `3000` | Port the HTTP server should listen on |
| **CORS_ALLOWED_ORIGINS** | No | `*` | Configures CORS policy. Accepts a comma-separated list of allowed domains. (`*` allows all domains; `disable` disables CORS entirely.) |
| **NODE_ENV** | No | `development` | Environment that the app is running in |
| **DATABASE_URL** | Yes | none | URL of the MongoDB server |
| **AUTHN_MECHANISM** | No | `anonymous` | Mechanism to use for authenticating users |
| **ENABLE_SCHEDULER** | No | `true` | Binary toggle for whether the task scheduler should run or not (see [Task Scheduling](#task-scheduling) for details) |
| **SYNC_COLLECTION_INDEXES_CRON** | No | `* * * * *` (every minute) | How often the [Collection Indexes Synchronization Task](#collection-indexes-synchronization-task) task should run (cron pattern) |
| **CHECK_WIP_ATTACK_IDS_CRON** | No | `0 * * * *` (every hour) | How often the [ATT&CK ID Reservation Monitoring Task](#attck-id-reservation-monitoring-task) task should run (cron pattern) |
| **JSON_CONFIG_PATH** | No | `` | Location of a JSON file containing configuration values |
| **LOG_LEVEL** | No | `info` | Level of messages to be written to the log (error, warn, http, info, verbose, debug) |
| **WB_REST_STATIC_MARKING_DEFS_PATH** | No | `./app/lib/default-static-marking-definitions/` | Path to a directory containing static marking definitions |

A typical value for DATABASE_URL when running locally is `mongodb://localhost/attack-workspace`.

### Configuration File

If the `JSON_CONFIG_PATH` environment variable is set, the app will read configuration settings from a JSON file at that location.

| Property | Type | Corresponding Environment Variable |
|----------|------|-----------------------------------|
| **server.port** | int | PORT |
| **server.corsAllowedOrigins** | string/array | CORS_ALLOWED_ORIGINS |
| **app.env** | string | NODE_ENV |
| **database.url** | string | DATABASE_URL |
| **logging.logLevel** | string | LOG_LEVEL |
| **scheduler.enableScheduler** | boolean | ENABLE_SCHEDULER |
| **scheduler.syncCollectionIndexesCron** | string | SYNC_COLLECTION_INDEXES_CRON |
| **scheduler.checkWipAttackIdsCron** | string | CHECK_WIP_ATTACK_IDS_CRON |

Example configuration file:

```json
{
  "server": {
    "port": 4000,
    "corsAllowedOrigins": ["https://example.com", "https://workbench.example.com"]
  },
  "database": {
    "url": "mongodb://localhost/attack-workspace"
  },
  "logging": {
    "logLevel": "debug"
  },
  "scheduler": {
    "enableScheduler": true,
    "syncCollectionIndexesCron": "* * * * *",
    "checkWipAttackIdsCron": "0 * * * *"
  }
}
```

## Task Scheduling

The REST API uses [Node Schedule](https://github.com/node-schedule/node-schedule#readme) to schedule and run periodic tasks.

It uses a specific design pattern:

- Tasks are organized in isolated JS modules within the `app/scheduler/` directory.
- JS Modules must contain the suffix, `-task`. e.g., `foobar-task.js`
- JS Modules must schedule their own jobs and execute them in the global scope. For example:
  ```javascript
  function initializeTask() {
    const cronPattern = config.scheduler.checkWipAttackIdsCron;

    logger.info(`[check-wip-attack-ids] Scheduling task with cron pattern: ${cronPattern}`);

    schedule.scheduleJob(cronPattern, async () => {
      try {
        await checkWipAttackIds();
      } catch (err) {
        logger.error(`[check-wip-attack-ids] Task execution failed: ${err.message}`);
      }
    });

    logger.info('[check-wip-attack-ids] Task scheduled successfully');
  }

  // Initialize the task when this module is loaded
  if (config.scheduler.enableScheduler) {
    initializeTask();
  }
  ```
- All JS Modules containing schedulable tasks are dynamically loaded by `app/scheduler/index.js`. ONLY modules with the `-task` suffix are loaded!

To date, there are two tasks that are configured to automatically execute at application runtime:

- [Collection Indexes Synchronization Task](#collection-indexes-synchronization-task) (formerly the "collection manager")
- [ATT&CK ID Reservation Monitoring Task](#attck-id-reservation-monitoring-task)

### Collection Indexes Synchronization Task

* **File:** [app/scheduler/sync-collection-indexes-task.js](app/scheduler/sync-collection-indexes-task.js)
* **Default Schedule:** `* * * * *` (every minute)
* **Configuration:** `SYNC_COLLECTION_INDEXES_CRON` environment variable

This task manages the automatic synchronization of collection indexes and their subscribed collections from remote sources. It performs the following operations:

1. **Retrieves all collection indexes** from the local database that have automatic update policies enabled
2. **Checks if updates are needed** based on the configured interval since the last retrieval
3. **Fetches remote collection indexes** from their configured URLs and compares timestamps
4. **Updates local collection indexes** when newer versions are found remotely
5. **Processes subscriptions** by checking each subscribed collection in the collection index:
   - Compares local collection versions with available remote versions
   - Downloads and imports newer collection bundles automatically
   - Validates that bundles contain proper `x-mitre-collection` objects

This task ensures that Workbench stays synchronized with upstream ATT&CK data sources without manual intervention, making it easier to keep local collections current.

### ATT&CK ID Reservation Monitoring Task

* **File:** [app/scheduler/check-wip-attack-ids-task.js](app/scheduler/check-wip-attack-ids-task.js)
* **Default Schedule:** `0 * * * *` (every hour at minute 0)
* **Configuration:** `CHECK_WIP_ATTACK_IDS_CRON` environment variable

This task monitors for potential ATT&CK ID exhaustion issues by identifying work-in-progress (WIP) objects that have been assigned ATT&CK IDs. It performs the following operations:

1. **Scans all STIX object types** that can have ATT&CK IDs assigned:
   - Techniques (`attack-pattern`)
   - Tactics (`x-mitre-tactic`)
   - Groups (`intrusion-set`)
   - Software (`malware` and `tool`)
   - Mitigations (`course-of-action`)
   - Campaigns (`campaign`)
   - Data Sources (`x-mitre-data-source`)
   - Data Components (`x-mitre-data-component`)

2. **Identifies WIP objects with assigned IDs** by querying for objects in `work-in-progress` state that have an `attack_id` value

3. **Logs warnings** when such objects are found, as this may indicate:
   - Premature consumption of the limited ATT&CK ID namespace (IDs range from 0001-9999 per type)
   - Objects that may never be published, permanently reserving their IDs
   - Potential issues with automatic ID assignment workflows

4. **Generates a summary report** containing:
   - Total count of WIP objects with IDs
   - Breakdown by object type
   - Details of each affected object (STIX ID, ATT&CK ID, name, modification date)

This monitoring helps administrators identify and review objects that may be tying up valuable ID space unnecessarily.

## Authentication

The REST API supports different authentication mechanisms for both user and service authentication.

### Authentication Mechanisms

The application supports these user authentication mechanisms:

- **Anonymous**: Default mechanism with no actual authentication (primarily for local development)
- **OpenID Connect (OIDC)**: Integration with organizational identity providers

### OpenID Connect (OIDC) Configuration

To enable OIDC authentication:

1. **Register with your OIDC Identity Provider** with these details:
   - Authentication flow: Authorization Code Flow
   - Required claims: `email` (required), `preferred_username` (optional), `name` (optional)
   - Grant Types: Client Credentials, Authorization Code, and Refresh Token
   - Redirect URL: `<host_url>/api/authn/oidc/callback`

2. **Configure the REST API** with these environment variables:

| Environment Variable | Required | Description | Configuration Property |
|---------------------|----------|-------------|------------------------|
| **AUTHN_MECHANISM** | Yes | Must be set to `oidc` | userAuthn.mechanism |
| **AUTHN_OIDC_CLIENT_ID** | Yes | Client ID from your OIDC provider | userAuthn.oidc.clientId |
| **AUTHN_OIDC_CLIENT_SECRET** | Yes | Client secret from your OIDC provider | userAuthn.oidc.clientSecret |
| **AUTHN_OIDC_ISSUER_URL** | Yes | Issuer URL for the Identity Server | userAuthn.oidc.issuerUrl |
| **AUTHN_OIDC_REDIRECT_ORIGIN** | Yes | URL for the Workbench host | userAuthn.oidc.redirectOrigin |

### Service Authentication

For service-to-service communication, the REST API supports three methods:

1. **API Key Challenge Authentication**: Services obtain a JWT using a challenge-response protocol
2. **API Key Basic Authentication**: Services authenticate using HTTP Basic Authentication
3. **OIDC Client Credentials Flow**: Services obtain a JWT from an OIDC provider

## User Management

The REST API includes a user management system when using OIDC authentication.

### User Roles and Permissions

The system supports these roles:

| Role | Description |
|------|-------------|
| `none` | No access to the system (for pending/inactive users) |
| `visitor` | Read-only access to ATT&CK objects |
| `editor` | Read and write access to ATT&CK objects |
| `admin` | Full access to all system capabilities, including user management |

### User Account Status

| Status | Description |
|--------|-------------|
| `pending` | User has registered but awaits approval |
| `active` | User is registered and approved |
| `inactive` | User is no longer active |

### User Management Endpoints

| Endpoint | Method | Description | Authorization |
|----------|--------|-------------|--------------|
| `/api/user-accounts` | GET | List all users | Admin only |
| `/api/user-accounts/:id` | GET | Get user by ID | Admin or self |
| `/api/user-accounts/register` | POST | Register new user | Logged in, unregistered users |
| `/api/user-accounts/:id` | PUT | Update user | Admin only |

## API Documentation

When running in development mode (`NODE_ENV=development`), the REST API provides interactive documentation via Swagger UI at the `/api-docs` endpoint.

For a local deployment, this is typically available at `http://localhost:3000/api-docs`.

## Management and Administration

### Health Checks

The REST API provides a health check endpoint at `/api/health` that returns the status of the application and its connections.

### Logging

Logging can be configured using the `LOG_LEVEL` environment variable or the `logging.logLevel` configuration property. Available log levels are:

- `error`: Only errors are logged
- `warn`: Errors and warnings are logged
- `http`: HTTP requests, errors, and warnings are logged
- `info`: General information plus the above (default)
- `verbose`: More detailed information
- `debug`: Debug-level information

### Backup and Restore

The REST API stores all data in MongoDB. To backup and restore:

1. **Backup**: Use MongoDB's standard backup tools (e.g., `mongodump`)
2. **Restore**: Use MongoDB's standard restore tools (e.g., `mongorestore`)

## Troubleshooting

Common issues and their solutions:

1. **Connection to MongoDB fails**:
   - Verify MongoDB is running
   - Check the `DATABASE_URL` environment variable
   - Ensure network connectivity between the REST API and MongoDB

2. **OIDC authentication fails**:
   - Verify the OIDC configuration variables
   - Check that the redirect URL is correctly registered with your OIDC provider
   - Ensure the client ID and secret are correct

3. **CORS issues**:
   - Configure the `CORS_ALLOWED_ORIGINS` to include your frontend application's domain
   - For development, you can set it to `*` to allow all origins

4. **Permission denied errors**:
   - Check the user's role and status
   - Ensure the user account has the necessary permissions for the operation