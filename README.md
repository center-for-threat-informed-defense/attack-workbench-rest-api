# ATT&CK Workbench REST API
- [ATT&CK Workbench Frontend](https://github.com/center-for-threat-informed-defense/attack-workbench-frontend): the front-end UI for the ATT&CK Workbench tool.
- [ATT&CK Workbench Collection Manager](https://github.com/center-for-threat-informed-defense/attack-workbench-collection-manager): REST API and CLI for managing collections.
- ATT&CK Workbench REST API: REST API service for storing, querying and editing ATT&CK objects.

## Installation

### Installing using Docker
Please refer to our [Docker install instructions](https://github.com/center-for-threat-informed-defense/attack-workbench-frontend/blob/master/docs/docker-compose.md) for information on installing and deploying the app using Docker.

### Manual Installation

The ATT&CK Workbench REST API is a Node.js application that uses a MongoDB database for persisting data.

#### Requirements

- [Node.js](https://nodejs.org) version `14.16.1` or greater

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

##### Step 3. Set the environment variables

| name                        | required | default       | description                                                        |
|-----------------------------|----------|---------------|--------------------------------------------------------------------|
| **PORT**                    | no       | `3000`        | Port the HTTP server should listen on                              |
| **NODE_ENV**                | no       | `development` | Environment that the app is running in                             |
| **DATABASE_URL**            | yes      | none          | URL of the MongoDB server                                          |
| **ENABLE_CORS_ANY_ORIGIN**  | no       | `true`        | Allows requests from any domain to access the REST API endpoints   |
| **DEFAULT_INTERVAL**        | no       | `300`         | How often collection indexes should check for updates (in seconds) |


A typical value for DATABASE_URL when running on a development machine is `mongodb://localhost/attack-workspace`.
This assumes that a MongoDB server is running on the same machine and is listening on the standard port of 27017.
The MongoDB server can be running natively or in a Docker container.

##### Step 4. Run the app

```
node ./bin/www
```

## REST API Documentation

When running with the NODE_ENV environment variable set to `development`, the app hosts a description of the REST API using the Swagger UI module.
The REST API documentation can be viewed using a browser at the path `/api-docs`.
For a basic installation on the local machine the documentation is at:

http://localhost:3000/api-docs

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

### Generate REST API Documentation

In addition to the Swagger UI that is available when the app is running, a static set of files describing the REST API can be generated.
Use the command:

`npm run api:generate-all`

to generate the set of static HTML files that document the REST API.

## Github Workflow

This project is configured to run a Github workflow when one or more commits are pushed to the Github repo.

The workflow is defined in `.github/workflows/ci-workflow.yml`

## Notice 

Copyright 2020-2021 MITRE Engenuity. Approved for public release. Document number CT0020

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at 

http://www.apache.org/licenses/LICENSE-2.0 

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License. 

This project makes use of ATT&CK®

[ATT&CK Terms of Use](https://attack.mitre.org/resources/terms-of-use/)
