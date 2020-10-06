# Federated ATT&CK REST API
- [federated-attack-frontend](https://github.com/center-for-threat-informed-defense/federated-attack-frontend): the front-end UI for the Federated ATT&CK Editor.
- [federated-attack-collection-manager](https://github.com/center-for-threat-informed-defense/federated-attack-collection-manager): REST API and CLI for managing collections.
- federated-attack-rest-api: REST API service for storing, querying and editing ATT&CK objects.

## Scripts

`package.json` contains a number of scripts that can be used to perform recurring tasks.

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

The REST API is defined using OpenAPI.
Use the command:

`npm run api:generate-all`

to generate the website that documents the REST API.

## Github Workflow

This project is configued to run a Github workflow when one or more commits are pushed to the Github repo.

The workflow is defined in `.github/workflows/ci-workflow.yml`

## Notice 

Copyright 2020 MITRE Engenuity. Approved for public release. 

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at 

http://www.apache.org/licenses/LICENSE-2.0 

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License. 

This project makes use of ATT&CK®

[ATT&CK Terms of Use](https://attack.mitre.org/resources/terms-of-use/)
