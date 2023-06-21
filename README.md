# ATT&CK Workbench REST API

The ATT&CK Workbench is an application allowing users to **explore**, **create**, **annotate**, and **share** extensions of the MITRE ATT&CK® knowledge base. 

This repository contains the REST API service for storing, querying, and editing ATT&CK objects. It is a Node.js application that uses a MongoDB database for persisting data. 

The ATT&CK Workbench application requires additional components for full operation. The [ATT&CK Workbench Frontend](https://github.com/center-for-threat-informed-defense/attack-workbench-frontend) repository contains the full documentation of the scope and function of the project. See the [install and run](#install-and-run) instructions for more details about setting up the entire project.

## REST API Documentation

When running with the NODE_ENV environment variable set to `development`, the app hosts a description of the REST API using the Swagger UI module.
The REST API documentation can be viewed using a browser at the path `/api-docs`. 

For a basic installation on the local machine this documentation can be accessed at `http://localhost:3000/api-docs`.

The [docs](/docs/README.md) folder contains additional documentation about using the REST API:
- [changelog](/docs/changelog.md): records of updates to the REST API.
- [workbench data model](/docs/data-model.md): additional information about data model of objects stored via the REST API.
- [standalone docker installation](/docs/docker.md): instructions for setting up the REST API via docker. Note that this is not the same as the full [ATT&CK Workbench Docker Installation](https://github.com/center-for-threat-informed-defense/attack-workbench-frontend/blob/master/docs/docker-compose.md).
- [contributing](/docs/contributing.md): information about how to contribute to this project.

## Install and run

The ATT&CK Workbench application is made up of several repositories. For the full application to operate each needs to be running at the same time. The [docker install instructions](docs/docker-compose.md) will install all components and is recommended for most deployments. Pre-built Docker images are available on [CTID's Github Packages](https://github.com/orgs/center-for-threat-informed-defense/packages?tab=packages&q=workbench).
- [ATT&CK Workbench Frontend](https://github.com/center-for-threat-informed-defense/attack-workbench-frontend) 
  
  The front-end user interface for the ATT&CK Workbench tool, and the primary interface through which the knowledge base is accessed.
- [ATT&CK Workbench REST API](https://github.com/center-for-threat-informed-defense/attack-workbench-rest-api) (this repository)

  REST API service for storing, querying and editing ATT&CK objects.
- [ATT&CK Workbench Collection Manager](https://github.com/center-for-threat-informed-defense/attack-workbench-collection-manager)

  REST API and services for managing collections, collection indexes, and collection subscriptions. 
  
  The collection manager is **not** required to be installed to use the ATT&CK Workbench, but is **highly recommended**. If you opt not to install the collection-manager you will not be able to import or export data from your local knowledge base. If the collection manager is not installed, set `integrations.collection_manager.enabled` to `false` in the front-end environment. See [modifying the environment](https://github.com/center-for-threat-informed-defense/attack-workbench-frontend#modifying-the-environment) for more details.

The manual install instructions in each repository describe how each component to be deployed to a separate machine or with customized settings. 

### Installing using Docker
Please refer to our [Docker install instructions](https://github.com/center-for-threat-informed-defense/attack-workbench-frontend/blob/master/docs/docker-compose.md) for information on installing and deploying the app using Docker. The docker setup is the easiest way to deploy the application.

### Manual Installation

#### Requirements

- [Node.js](https://nodejs.org) version `18.12.1` or greater
- An instance of [MongoDB](https://www.mongodb.com/) version `4.4.x` or greater
 
#### Installation

##### Step 1. Clone the git repository

```
git clone git@github.com:center-for-threat-informed-defense/attack-workbench-rest-api.git
cd attack-workbench-rest-api
```

##### Step 2. Install the dependencies

The ATT&CK Workbench REST API installs all dependencies within the project.
It doesn't depend on the global installation of any modules.

```
npm install
```

##### Step 3. Configure the system

The app can be configured using environment variables, a configuration file, or a combination of these methods.
Note that any values set in a configuration file take precedence over values set using environment variables.

###### Using Environment Variables

| name                                 | required | default       | description                                               |
|--------------------------------------|----------|---------------|-----------------------------------------------------------|
| **PORT**                             | no       | `3000`        | Port the HTTP server should listen on                     |
| **ENABLE_CORS_ANY_ORIGIN**           | no       | `true`        | Allows requests from any domain to access the REST API endpoints |
| **NODE_ENV**                         | no       | `development` | Environment that the app is running in                    |
| **DATABASE_URL**                     | yes      | none          | URL of the MongoDB server                                 |
| **AUTHN_MECHANISM**                  | no       | `anonymous`   | Mechanism to use for authenticating users                 |
| **DEFAULT_INTERVAL**                 | no       | `300`         | How often collection indexes should check for updates (in seconds) |
| **JSON_CONFIG_PATH**                 | no       | ``            | Location of a JSON file containing configuration values   |
| **LOG_LEVEL**                        | no       | `info`        | Level of messages to be written to the log (error, warn, http, info, verbose, debug) |
| **WB_REST_STATIC_MARKING_DEFS_PATH** | no       | `./app/lib/default-static-marking-definitions/` | Path to a directory containing static marking definitions |

A typical value for DATABASE_URL when running on a development machine is `mongodb://localhost/attack-workspace`.
This assumes that a MongoDB server is running on the same machine and is listening on the standard port of 27017.
The MongoDB server can be running natively or in a Docker container.

###### Using a Configuration File

If the `JSON_CONFIG_PATH` environment variable is set, the app will also read configuration settings from a JSON file at that location.

| name                                | type     | corresponding environment variable |
|-------------------------------------|----------|------------------------------------|
| **server.port**                     | int      | PORT                               |
| **server.enableCorsAnyOrigin**      | boolean  | ENABLE_CORS_ANY_ORIGIN             |
| **app.env**                         | string   | NODE_ENV                           |
| **database.url**                    | string   | DATABASE_URL                       |
| **collectionIndex.defaultInterval** | int      | DEFAULT_INTERVAL                   |
| **logging.logLevel**                | string   | LOG_LEVEL                          |

Sample configuration file setting the server port and database url:

```json
{
  "server": {
    "port": 4000
  },
  "database": {
    "url": "mongodb://localhost/attack-workspace"
  }
}
```


##### Step 4. Run the app

```
node ./bin/www
```

## Scripts

`package.json` contains a number of scripts that can be used to perform recurring tasks.

### Regression Tests

There is a set of regression tests that can be run to validate the operation of the REST API.
These use the Mocha framework to send a series of HTTP requests to the app.
The tests automatically run both the app and the required MongoDB instance, no special setup is required.
To facilitate testing, the tests are configured to use an in-memory version of MongoDB and data is loaded into the database as-needed for the test cases.

Use the command:

`npm run test`

to run the regression tests.

### JavaScript Linter

Use the command:

`npm run lint`

to run ESLint on the codebase.

### Validate Module Versions

Use the command

`npm run snyk`

to run the Snyk validator on the currently installed modules.
This will check the modules for known security flaws.

Note that this requires the `SNYK_TOKEN` environment variable to be set to a valid Snyk token to run.

## Github Workflow

This project is configured to run a Github workflow when one or more commits are pushed to the Github repo.

The workflow is defined in `.github/workflows/ci-workflow.yml`

## Notice 

Copyright 2020-2023 MITRE Engenuity. Approved for public release. Document number CT0020

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at 

http://www.apache.org/licenses/LICENSE-2.0 

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License. 

This project makes use of ATT&CK®

[ATT&CK Terms of Use](https://attack.mitre.org/resources/terms-of-use/)
