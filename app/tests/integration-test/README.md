## Integration Test

### 1  Start the Servers

- MongoDB
- REST API
- Mock Remote Host
- Collection Manager

### 2  Clear the Database

In the attack-workbench-rest-api project, run:

```shell
node ./scripts/clearDatabase.js
```

Also, delete the collection index manually. (The script only deletes ATT&CK objects and references.)

### 3  Initialize Data

In this project, run:

```shell
bash ./tests/integration-test/initialize-data.sh
```

This script will:
- Clear the test directories
- Copy the collection index v1 file to the index test directory
- Copy the collection bundle Blue v1 to the bundle test directory
- Run a JavaScript program to read the collection index file and import the collection index into the database

Because the collection index is initialized with a subscription for the Blue collection, this should cause the Collection Manager to import the collection bundle Blue v1.

### 4  Update the Collection Index

In this project, run:

```shell
bash ./tests/integration-test/update-collection-a.sh
```

This script will:
- Copy collection index v2 to the index test directory, overwriting v1
- Copy the collection bundles Blue v2, Red v1, and Green v1 to the bundle test directory

Due to the subscription to the Blue collection, this should cause the Collection Manager to import the collection bundle Blue v2.

### 5  Add a New Subscription

In this project, run:

```shell
bash ./tests/integration-test/update-subscription.sh
```

This script will:
- Modify the collection index in the database, adding a subscription to the Green collection

Due to the added subscription to the Green collection, this should cause the Collection Manager to import the collection bundle Green v1.
