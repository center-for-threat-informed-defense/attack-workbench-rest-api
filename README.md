# federated-attack-rest-api

REST API service for the ATT&CK Workspace.

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
