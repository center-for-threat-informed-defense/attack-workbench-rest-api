# Standalone Docker Installation
The ATT&CK Workbench Frontend project includes a `docker-compose.yml` file that can be used to install all of the ATT&CK Workbench components as part of a Docker Compose installation.

This document describes an alternate method of installing the ATT&CK Workbench REST API service in a Docker container without using Docker Compose. 

## Create a Docker Image for the REST API
Creating the Docker image builds the REST API service, including downloading all dependencies.
This step requires access to a Docker registry, either Docker Hub or a privately hosted registry. 
```shell
docker build --tag attack-workbench/rest-api .
```

## Create the Docker Network
The REST API needs to be able to communicate with the MongoDB service, and needs to be reachable by the ATT&CK Workbench Frontend application and Collection Manager service.
Create a Docker network to support this network communication. This only needs to be done once.
```shell
docker network create attack-workbench-network
```

## Create and Run a Docker Container for MongoDB
The REST API requires access to an instance of MongoDB.
```shell
docker run --name attack-workbench-mongodb -d --network attack-workbench-network mongo:latest
```

## Create and Run a Docker Container for the REST API
This command will run the REST API by creating a Docker container and starting it.
```shell
docker run -p 3000:3000 -d \
  --name attack-workbench-rest-api \
  --env DATABASE_URL=mongodb://attack-workbench-mongodb/attack-workspace \
  --network attack-workbench-network \
  attack-workbench/rest-api
```
#### REST API Port
The REST API service listens on container port 3000 by default.
This command maps port 3000 (in the container) to port 3000 (on the host), making the api accessible from the host.

#### MongoDB
This command sets the `DATABASE_URL` environment variable to configure the REST API service to access the MongoDB instance running on the `attack-workbench-mongodb` host on the default port of `27017`.

## Configuring the REST API

As an alternative to providing app configuration settings through environment variables, the REST API service supports configuring the app using a configuration file.
When deploying the REST API with Docker, it can be useful to maintain a configuration file on the host system, map that file to a location in the Docker container, and set the `JSON_CONFIG_PATH` environment variable to tell the app to use the configuration file.
This allows the system configuration to be maintained outside of the Docker environment.

For example, this configuration file disables CORS and provides the URL for the database:

```json
{
  "server": {
    "enableCorsAnyOrigin": false
  },
  "database": {
    "url": "mongodb://attack-workbench-mongodb/attack-workspace"
  }
}
```

If this file is located on the host system at `~/attack-workbench-settings/aw-prod.json`, you can use the following command to run the REST API in a Docker container with that configuration file.
```shell
docker run -p 3000:3000 -d \
  --name attack-workbench-rest-api \
  --env JSON_CONFIG_PATH=/usr/src/app/settings/aw-prod.json \
  --volume ~/attack-workbench-settings:/usr/src/app/settings \
  --network attack-workbench-network \
  attack-workbench/rest-api
```


