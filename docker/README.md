# Docker Installation

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
Run the REST API by creating a Docker container and starting it.
```shell
docker run -p 4000:3000 -d --name attack-workbench-rest-api --env DATABASE_URL=mongodb://attack-workbench-mongodb/attack-workspace --network attack-workbench-network attack-workbench/rest-api
```

