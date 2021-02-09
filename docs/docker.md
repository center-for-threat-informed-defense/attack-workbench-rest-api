# Standalone Docker Installation
The ATT&CK Workbench Frontend project includes a `docker-compose.yml` file that can be used to install all of the ATT&CK Workbench components as part of a Docker Compose installation.

This document describes an alternate method of installing the ATT&CK Workbench REST API service in a Docker container without using Docker Compose. 

## Create a Docker Image for the REST API
Creating the Docker image builds the REST API service, including downloading all dependencies.
This step requires access to a Docker registry, either Docker Hub or a privately hosted registry. 
```shell
docker build --tag attack-workbench/rest-api --file ./docker/Dockerfile .
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
docker run -p 3000:3000 -d --name attack-workbench-rest-api --env DATABASE_URL=mongodb://attack-workbench-mongodb/attack-workspace --network attack-workbench-network attack-workbench/rest-api
```
### REST API Port
The REST API service listens on container port 3000 by default.
This command maps port 3000 (in the container) to port 3000 (on the host).

### MongoDB
This command sets the `DATABASE_URL` environment variable to configure the REST API service to access the MongoDB instance running on the `attack-workbench-mongodb` host on the default port of `27017`.

